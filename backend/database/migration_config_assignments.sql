-- Ajouter les configurations pour le système d'assignation amélioré
INSERT INTO config (key, value, description) VALUES
  ('simultaneous_offer_count', '3', 'Nombre de chauffeurs à proposer simultanément (3-5 recommandé)'),
  ('multiple_offer_timeout', '90', 'Timeout en secondes pour les propositions multiples (90 secondes)'),
  ('max_assignment_attempts', '7', 'Nombre maximum de tentatives d''assignation avant passage en attente manuelle'),
  ('max_assignment_distance', '50', 'Distance maximale en km pour l''assignation (géolocalisation)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

