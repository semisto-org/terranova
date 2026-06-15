require 'test_helper'

# Couvre l'issue PWA iOS : service worker (coquille app-shell), manifest enrichi
# et balises meta iOS dans le layout. Les assets statiques (sw.js, manifest) sont
# servis par le file server (activé en test) ; le rendu de page Inertia nécessite
# un build Vite de test et est donc sauté quand `public/vite-test` est absent
# (même garde que public_species_test).
class PwaAssetsTest < ActionDispatch::IntegrationTest
  VITE_TEST_BUILD = Rails.root.join('public', 'vite-test')

  test 'le service worker est servi à la racine du scope comme du JavaScript' do
    get '/sw.js'
    assert_response :success
    assert_match(/javascript/, response.media_type.to_s)
    # Cache versionné présent + API toujours réseau (jamais cachée).
    assert_includes response.body, 'terranova-shell-'
    assert_includes response.body, "url.pathname.startsWith('/api/')"
    assert_includes response.body, 'self.skipWaiting()'
    assert_includes response.body, 'self.clients.claim()'
  end

  test 'le manifest est enrichi (start_url, scope, lang, dir, description) et conserve couleurs + icônes' do
    get '/site.webmanifest'
    assert_response :success
    manifest = JSON.parse(response.body)
    assert_equal '/', manifest['start_url']
    assert_equal '/', manifest['scope']
    assert_equal 'fr', manifest['lang']
    assert_equal 'ltr', manifest['dir']
    assert manifest['description'].present?, 'description manquante'
    # Couleurs et icônes existantes conservées.
    assert_equal '#5b5781', manifest['theme_color']
    assert_equal '#5b5781', manifest['background_color']
    assert_equal 'standalone', manifest['display']
    assert_equal 4, manifest['icons'].size
  end

  test 'au moins une image de démarrage iOS générique existe dans public/' do
    assert File.exist?(Rails.root.join('public', 'apple-splash-generic.png')),
           'apple-splash-generic.png manquante'
  end

  test 'le layout expose les balises meta PWA iOS, le viewport cover et un startup image' do
    skip 'Rendu de page Inertia : build Vite de test absent (public/vite-test)' unless File.directory?(VITE_TEST_BUILD)
    get '/login'
    assert_response :success
    assert_includes response.body, 'name="apple-mobile-web-app-capable"'
    assert_includes response.body, 'name="mobile-web-app-capable"'
    assert_includes response.body, 'name="apple-mobile-web-app-status-bar-style"'
    assert_includes response.body, 'viewport-fit=cover'
    assert_includes response.body, 'rel="apple-touch-startup-image"'
    assert_includes response.body, 'rel="manifest"'
  end
end
