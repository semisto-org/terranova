require 'test_helper'

# Message Board par projet (#118, epic #101 — Phase 4).
# Couvre : CRUD posts imbriqués par projet (les 4 Projectable), sanitization du
# corps TipTap, création d'un post → ActivityEvent (#110) + notification aux
# membres du projet (#104), post commentable (#102) et suivable (#103),
# suppression auteur-ou-admin.
class MessageBoardTest < ActionDispatch::IntegrationTest
  setup do
    @author = create_member(first_name: 'Ada')
    @teammate = create_member(first_name: 'Boris')
    @outsider = create_member(first_name: 'Clara')
    @admin = create_member(first_name: 'Root', is_admin: true)
    Thread.current[:test_member] = @author

    @project = PoleProject.create!(name: "Communication-#{SecureRandom.hex(3)}", pole: 'academy')
    @project.project_memberships.create!(member: @author, role: 'member')
    @project.project_memberships.create!(member: @teammate, role: 'member')
  end

  teardown { Thread.current[:test_member] = nil }

  # ── CRUD ──────────────────────────────────────────────────────────────────

  test 'create a post on a lab project persists title + body and returns it' do
    assert_difference -> { Post.count } => 1 do
      post "/api/v1/projects/lab-project/#{@project.id}/posts",
           params: { title: 'Réunion mensuelle', body: '<p>On se voit lundi.</p>' }, as: :json
    end
    assert_response :created

    payload = JSON.parse(response.body)['post']
    assert_equal 'Réunion mensuelle', payload['title']
    assert_equal '<p>On se voit lundi.</p>', payload['body']
    assert_equal @author.id.to_s, payload['authorId']
    assert payload['canEdit']

    created = Post.last
    assert_equal @project, created.projectable
    assert_equal @author, created.author
  end

  test 'a post can be created on each Projectable type' do
    design = Design::Project.create!(
      name: "Jardin-#{SecureRandom.hex(3)}", client_id: "c-1", client_name: "Commune",
      phase: "offre", status: "active"
    )
    ttype = Academy::TrainingType.create!(name: "Type-#{SecureRandom.hex(3)}")
    training = Academy::Training.create!(title: "Formation-#{SecureRandom.hex(3)}", status: "idea", training_type: ttype)
    guild = Guild.create!(name: "Guilde-#{SecureRandom.hex(3)}")

    {
      'design-project' => design,
      'training' => training,
      'guild' => guild,
    }.each do |type_key, projectable|
      post "/api/v1/projects/#{type_key}/#{projectable.id}/posts",
           params: { title: "Hello #{type_key}", body: '<p>x</p>' }, as: :json
      assert_response :created, "create failed for #{type_key}: #{response.body}"
      assert_equal projectable, Post.last.projectable
    end
  end

  test 'index lists posts antichronologically with author + comments count' do
    older = @project.posts.create!(author: @teammate, title: 'Vieux', body: '<p>1</p>', created_at: 2.hours.ago)
    newer = @project.posts.create!(author: @author, title: 'Récent', body: '<p>2</p>')
    older.comments.create!(author: @author, body: '<p>un commentaire</p>')

    get "/api/v1/projects/lab-project/#{@project.id}/posts", as: :json
    assert_response :success

    posts = JSON.parse(response.body)['posts']
    assert_equal [newer.id.to_s, older.id.to_s], posts.map { |p| p['id'] }
    assert_equal 'Boris H', posts.last['authorName']
    assert_equal 1, posts.last['commentsCount']
  end

  test 'show returns the full body of a single post' do
    p = @project.posts.create!(author: @author, title: 'Détail', body: '<p>corps complet</p>')
    get "/api/v1/posts/#{p.id}", as: :json
    assert_response :success
    assert_equal '<p>corps complet</p>', JSON.parse(response.body)['post']['body']
  end

  test 'update edits title and body for the author' do
    p = @project.posts.create!(author: @author, title: 'Avant', body: '<p>avant</p>')
    patch "/api/v1/posts/#{p.id}", params: { title: 'Après', body: '<p>après</p>' }, as: :json
    assert_response :success
    p.reload
    assert_equal 'Après', p.title
    assert_equal '<p>après</p>', p.body
  end

  test 'empty title is rejected' do
    post "/api/v1/projects/lab-project/#{@project.id}/posts",
         params: { title: '', body: '<p>sans titre</p>' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'empty body is rejected' do
    post "/api/v1/projects/lab-project/#{@project.id}/posts",
         params: { title: 'Titre', body: '' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'unknown project type yields not found' do
    post "/api/v1/projects/banana/#{@project.id}/posts",
         params: { title: 'x', body: '<p>x</p>' }, as: :json
    assert_response :not_found
  end

  # ── Sanitization ────────────────────────────────────────────────────────────

  test 'script tags are stripped from the body while allowed markup survives' do
    body = %(<p>Bonjour<script>alert(1)</script> <strong>tous</strong></p>)
    post "/api/v1/projects/lab-project/#{@project.id}/posts",
         params: { title: 'Sécurité', body: body }, as: :json
    assert_response :created

    saved = Post.last.body
    refute_includes saved, '<script'
    assert_includes saved, '<strong>tous</strong>'
  end

  # ── Activity (#110) + Notifications (#104) ──────────────────────────────────

  test 'creating a post records one ActivityEvent and notifies project members' do
    assert_difference -> { ActivityEvent.where(action: 'post_created').count } => 1 do
      post "/api/v1/projects/lab-project/#{@project.id}/posts",
           params: { title: 'Annonce', body: '<p>important</p>' }, as: :json
    end
    assert_response :created

    created = Post.last
    event = ActivityEvent.where(action: 'post_created', subject: created).sole
    assert_equal @author, event.actor
    assert_equal @project, event.projectable

    # Le coéquipier est notifié ; l'auteur ne l'est jamais ; l'outsider non plus.
    recipients = Notification.where(activity_event: event).pluck(:recipient_id)
    assert_includes recipients, @teammate.id
    refute_includes recipients, @author.id
    refute_includes recipients, @outsider.id
  end

  test 'creating a post auto-subscribes the project members to it' do
    post "/api/v1/projects/lab-project/#{@project.id}/posts",
         params: { title: 'Suivi', body: '<p>x</p>' }, as: :json
    created = Post.last
    assert_equal [@author.id, @teammate.id].sort, created.subscriptions.pluck(:member_id).sort
  end

  # ── Commentable (#102) ──────────────────────────────────────────────────────

  test 'a post is commentable through the nested route' do
    p = @project.posts.create!(author: @author, title: 'Discussion', body: '<p>débat</p>')
    Thread.current[:test_member] = @teammate

    assert_difference -> { Comment.count } => 1 do
      post "/api/v1/posts/#{p.id}/comments", params: { body: '<p>je réponds</p>' }, as: :json
    end
    assert_response :created
    assert_equal p, Comment.last.commentable
  end

  # ── Suivable (#103) ─────────────────────────────────────────────────────────

  test 'a post is followable through the nested subscription route' do
    p = @project.posts.create!(author: @author, title: 'À suivre', body: '<p>x</p>')
    Thread.current[:test_member] = @outsider

    post "/api/v1/posts/#{p.id}/subscription", as: :json
    assert_response :created
    assert JSON.parse(response.body)['subscribed']
    assert p.subscribed?(@outsider)
  end

  # ── Suppression auteur-ou-admin ─────────────────────────────────────────────

  test 'author can delete their own post' do
    p = @project.posts.create!(author: @author, title: 'À effacer', body: '<p>x</p>')
    assert_difference -> { Post.count } => -1 do
      delete "/api/v1/posts/#{p.id}", as: :json
    end
    assert_response :no_content
  end

  test 'a non-author non-admin member cannot delete the post' do
    p = @project.posts.create!(author: @author, title: 'Protégé', body: '<p>x</p>')
    Thread.current[:test_member] = @teammate
    assert_no_difference -> { Post.count } do
      delete "/api/v1/posts/#{p.id}", as: :json
    end
    assert_response :forbidden
  end

  test 'an admin can delete any post' do
    p = @project.posts.create!(author: @author, title: 'Modérable', body: '<p>x</p>')
    Thread.current[:test_member] = @admin
    assert_difference -> { Post.count } => -1 do
      delete "/api/v1/posts/#{p.id}", as: :json
    end
    assert_response :no_content
  end

  test 'deleting a post cascades its comments' do
    p = @project.posts.create!(author: @author, title: 'Avec commentaires', body: '<p>x</p>')
    p.comments.create!(author: @teammate, body: '<p>coucou</p>')
    assert_difference -> { Comment.count } => -1 do
      delete "/api/v1/posts/#{p.id}", as: :json
    end
  end

  private

  def create_member(first_name:, is_admin: false)
    Member.create!(
      first_name: first_name, last_name: 'H',
      email: "#{first_name.downcase}-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective', is_admin: is_admin
    )
  end
end
