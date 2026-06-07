# Questions ouvertes — Epic Moteur de coordination Academy

> À trancher avec Michael (réponses oui/non ou A/B de préférence). Mis à jour
> au fil de l'implémentation. Les choix déjà posés sont dans
> `docs/epics/academy-coordination-engine.md`.

## Décisions par défaut prises (à confirmer ou corriger)

Pour ne pas bloquer, j'ai pris des défauts raisonnables. Dis-moi si l'un te gêne.

1. **Checklist d'annulation par défaut** (#35) — quand on annule une activité, je
   crée ces tâches à échéance du jour : *Contacter les étudiants · Contacter le·la
   formateur·rice · Prévenir le lieu · Prévenir Steph (repas) · Prévenir Les 4
   Sources (logement) · Gérer les remboursements · Prévenir partenaires/assistants*.
   → **L'ordre et les intitulés te conviennent ?** Assigné par défaut : le
   coordinateur de l'activité (rôle `organizer`/`project-manager`).

2. **Clôture (#48)** — au passage en `completed` quand tout n'est pas réglé
   (paiements / dépenses fournisseurs / documents), j'**avertis** mais je ne
   **bloque pas** (bouton « clôturer quand même »). → **OK, ou tu veux un blocage dur ?**

3. **Récap Slack (#43)** — posté à **23h** sur le webhook Slack existant
   (`SLACK_WEBHOOK_URL`, canal #ping-formations). Groupé **par personne**.
   → **Bon canal/heure ?** Veux-tu un canal « aujourd'hui » dédié (autre webhook) ?

4. **Message → tâche (#41)** — la tâche auto « Répondre à {nom} » est assignée au
   **coordinateur de l'activité** (`project_memberships` role organizer/PM). S'il
   n'y en a pas, la tâche reste non assignée dans la liste de l'activité.
   → **OK ?** Faut-il un destinataire de repli (Mohammad par défaut) ?

5. **Feedback J+1 (#21)** — un seul mail, le lendemain de chaque **session**
   terminée, vers tous les inscrits. Anonymat = l'identité est masquée à
   l'affichage équipe (mais conservée en base). → **OK pour conserver
   l'identité en base même si « anonyme » ?** (RGPD)

## Questions nécessitant ta décision (non tranchées)

6. **WhatsApp Business (#40)** — il me faut le **numéro WhatsApp Business** (et
   idéalement un message pré-rempli type). En attendant je lis `ENV["WHATSAPP_BUSINESS_NUMBER"]`
   et je masque le widget s'il est absent. → **Quel numéro ? On crée le compte Business ?**

7. **Espace formateur (#20)** — bloqué sur deux décisions métier :
   - **Cadence de facturation** : par journée / par formation / mensuel ? Upload requis ou conseillé ?
   - La **description du cours** par le formateur doit-elle être validée (comme les documents) avant diffusion aux participants ?

8. **Chat support (#18)** — V1 livrée sans temps réel (le participant rafraîchit).
   → **Suffisant pour démarrer, ou il faut une notif email à l'équipe à chaque
   message** (en plus de la tâche auto) ?

9. **Actus MySemisto (#17)** — une actu peut être liée à une **formation** et/ou
   une **session**. J'ai démarré au niveau **formation** (pilote le plus simple).
   → **On garde formation-only en V1, ou tu veux aussi le niveau session tout de suite ?**

10. **Pôles concernés** — tout est câblé sur Academy. Le drawer de tâches, le
    récap Slack et les réunions→tâches sont **génériques** (polymorphes). →
    **On garde le focus Academy pour cette PR, ou on ouvre aux autres pôles
    (Design, Nursery…) dès maintenant ?**
