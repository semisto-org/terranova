# Défauts standing — Terranova / Nova

> Les réponses **permanentes** de Michael aux questions que Nova se pose nuit après nuit.
> Nova lit ce fichier à chaque issue (chargé dans son prompt). **Si un défaut couvre sa
> question, elle l'applique sans la reposer.** Chaque ligne ici = une catégorie entière de
> blocages qui disparaît. Tu peux écraser n'importe quoi par une consigne explicite dans une issue.
>
> Tenir ce fichier à jour est l'investissement le plus rentable pour l'autonomie de Nova :
> dès qu'un blocage s'avère n'être qu'une préférence, ajoute-la ici.

## Conventions transverses (s'appliquent partout)

- **Fuseau horaire** : toujours `Europe/Brussels`. Ne jamais demander le fuseau ni supposer UTC.
- **Langue** : français pour tout texte visible des membres (UI, emails, libellés, erreurs).
- **Unités** : métrique (°C, m, kg, €).
- **Nommage** : reprendre **le précédent existant dans le code**. S'il existe déjà
  `strategy_comment_reactions`, le modèle généralisé s'appelle `Reaction`/`reactions`, pas `Boost`.
  Le code existant fait foi sur le vocabulaire ; ne pas inventer un nouveau terme s'il y a un précédent.

## Décisions UI/UX par défaut

- **Nouvelle surface = nouvel onglet/route.** Une nouvelle vue ne **remplace jamais** l'écran par
  défaut existant (ex. ne pas faire de « Mes projets » le nouveau défaut de `/` à la place du
  Tableau de bord). On l'ajoute comme onglet/section/route ; on garde l'accès à l'existant. Changer
  un écran par défaut reste une décision pour Michael (case ③).
- **Réutiliser les composants existants** plutôt que d'en créer des quasi-doublons (ex. réutiliser
  `MyTasksDashboard` si une vue « mes tâches » est demandée), sauf si les contraintes de place
  l'interdisent — auquel cas le signaler dans `assumptions`.
- **Cible d'un clic sur une tâche** : ouvrir la vue du projet parent avec le drawer de tâches
  (il n'y a pas de page « détail tâche » unique).

## Données

- **Champs legacy en texte libre** : ignorer les anciennes valeurs non structurées quand un
  équivalent structuré existe. Ex. `tasks.assignee_name` (texte libre, sans `assignee_id`) → ne
  traiter que les tâches avec `assignee_id`. Idem pour tout champ « *_name » doublonnant une FK.
- **Périmètre des objets polymorphes** : commencer par le **sous-ensemble minimal** qui satisfait
  les critères d'acceptation de l'issue, et étendre ensuite. Lister dans `assumptions` les types
  inclus vs reportés.
- **Acteur d'un événement manquant** : si un type d'objet n'a pas de colonne « qui a fait l'action »
  (ex. `events`, documents), livrer « sans acteur » pour ce type plutôt que de bloquer, et le noter.

## Découpage & périmètre

- **Toujours livrer la plus petite tranche indépendante et utile d'abord.** Préférer 3 PR petites
  et reviewables à une PR fleuve. Découper soi-même un epic clairement séparable (ne pas demander
  l'autorisation) ; lister les tranches restantes dans `assumptions`.

---

## À compléter par Michael (réponses produit récurrentes)

> Ces points sont revenus dans des blocages réels. Une fois remplis, Nova arrêtera de les demander.
> Laisse une ligne vide ou « (Nova décide) » si tu veux qu'elle tranche elle-même.

- **Notifications « calmes » (epic #101)** :
  - Cadence du digest email : _(ex. 1×/jour à 8h Europe/Brussels)_ → **à remplir**
  - Heures calmes par défaut (membre sans réglage) : _(ex. silence 19h→8h, ou aucune restriction)_ → **à remplir**
  - Seuil « échéance proche » d'une tâche : _(ex. J-1)_ → **à remplir**
  - Destinataires d'une notif quand l'abonnement (#103) n'existe pas encore : _(ex. assigné + membre coucouté seulement)_ → **à remplir**
- **« Mes events » dans le calendrier perso** : events où je suis attendu (`event_attendees`),
  events des projets dont je suis membre, ou l'union des deux ? → **à remplir**
- **« Mes échéances »** : tâches où je suis l'assigné uniquement, ou aussi les non-assignées de mes
  projets ? → **à remplir**
- **Mute au niveau projet vs suivi explicite d'un objet** : lequel gagne ? → **à remplir**
