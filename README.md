# Panier Commun

Application de courses et de repas de la semaine, pensée pour deux téléphones.
Une page, aucune dépendance, aucun compte à créer pour s'en servir.

→ **https://remix4449.github.io/panier-commun/**

- **Recettes** — tuiles lisibles, fiche complète avec recalcul des quantités
  selon le nombre de personnes, et une case à cocher sur la tuile qui verse les
  ingrédients dans la liste de courses (et les retire quand on la décoche, sans
  toucher à ce qui a été ajouté à la main).
- **Courses** — triées par rayon dans l'ordre d'un parcours de magasin. La barre
  de recherche comprend la quantité au vol (« 2 kg pommes de terre »), devine le
  rayon et propose les ingrédients déjà connus. Les quantités d'un même
  ingrédient venant de plusieurs recettes s'additionnent.
- **Semaine** — midi et soir sur sept jours, et un bouton qui envoie tous les
  repas planifiés dans les courses.

## Synchronisation entre deux téléphones

Par défaut, tout vit dans le `localStorage` du téléphone. La pastille en haut à
droite ouvre la feuille de synchronisation : on y colle l'adresse d'une base
Firebase Realtime Database et un code de foyer, puis on envoie le lien
d'invitation à l'autre téléphone (le code voyage dans le fragment `#f=`, il ne
part donc jamais vers un serveur).

Le transport n'utilise aucun SDK : lecture temps réel par `EventSource` sur le
flux SSE de l'API REST, écriture par `PUT` document par document. Chaque
document porte un `updatedAt` et le plus récent gagne ; les suppressions sont
des pierres tombales (`deleted: true`) purgées au bout de trente jours. Hors
ligne, les écritures s'empilent dans une file qui repart au retour du réseau.

Règles à publier sur la base — le code de foyer est le secret partagé :

```json
{
  "rules": {
    "f": {
      "$foyer": {
        ".read": "$foyer.length >= 12",
        ".write": "$foyer.length >= 12"
      }
    }
  }
}
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | toute l'application : styles, markup, logique |
| `sw.js` | coquille hors ligne (cache-first, mise à jour en arrière-plan) |
| `manifest.webmanifest` | installation sur l'écran d'accueil |
| `icon-*.png` | icônes générées, panier crème sur fond vert |

## Développement

Aucune étape de build. Pour servir en local :
`python3 -m http.server` à la racine du dépôt. Le service worker et
l'installation sur l'écran d'accueil demandent `http://localhost` ou du HTTPS —
en `file://` l'app fonctionne, mais sans ces deux-là.

Publication : *Settings → Pages → Deploy from a branch → `main` → `/ (root)`*.
