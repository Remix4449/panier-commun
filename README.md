# Panier Commun

Application de courses et de repas de la semaine, pensée pour deux téléphones.
Une page, aucune dépendance, aucun compte à créer pour s'en servir.

→ **https://remix4449.github.io/panier-commun/**

- **Recettes** — quarante-cinq recettes du carnet au départ, tuiles lisibles,
  fiche complète avec recalcul des quantités selon le nombre de personnes, et
  une case à cocher sur la tuile qui verse les ingrédients dans la liste de
  courses (et les retire quand on la décoche, sans toucher à ce qui a été
  ajouté à la main). La flèche ↓ en haut avale une recette venue d'ailleurs :
  son texte brut, un lien d'import, ou du JSON.
- **Courses** — triées par rayon dans l'ordre d'un parcours de magasin. La barre
  de recherche comprend la quantité au vol (« 2 kg pommes de terre »), devine le
  rayon et propose les ingrédients déjà connus — dont les deux cent dix-neuf
  produits du carnet, chacun avec le rayon où il se trouve. Les quantités d'un
  même ingrédient venant de plusieurs recettes s'additionnent.
- **Semaine** — midi et soir sur sept jours, et un bouton qui envoie tous les
  repas planifiés dans les courses.

## Le carnet

Les recettes et les produits de départ viennent du carnet tenu dans Notion
(« Planification de repas » : les bases *Recettes* et *Aliments & Stocks*). Ils
vivent en dur dans `index.html`, sous `STARTERS` et `PRODUITS` :

- `PRODUITS` liste les aliments du foyer par rayon. La liste de courses s'en
  sert deux fois — la barre de recherche les propose, et un article qu'on y
  retrouve est rangé sans passer par la devinette de `GUESS`.
- `STARTERS` porte les recettes : ingrédients, quantités et étapes. Une
  quantité absente (`qty: null`) s'affiche « — » : le carnet ne la donnait pas
  encore. Les catégories reprennent celles du carnet, *Healthy* et *Plaisir*.

À la première ouverture, l'application se garnit toute seule. Sur un téléphone
déjà en service, le bouton **Importer le carnet** de la feuille de
synchronisation ajoute les recettes du carnet qui manquent encore, sans toucher
à celles qui sont déjà là.

## Ajouter une recette trouvée ailleurs

Le bouton ↓ de l'écran Recettes ouvre une zone où coller ce qu'on a sous la
main : le texte d'une recette copié sur un site ou sorti d'une conversation,
un lien d'import, du JSON. L'app en tire titre, nombre de personnes, durée,
ingrédients — quantités et unités comprises — et étapes, puis affiche la
fiche pour relecture. Rien n'est enregistré avant d'avoir touché
« Enregistrer », et réimporter une recette déjà là met la sienne à jour au
lieu d'en créer une jumelle.

Un lien d'import porte la recette dans le fragment de l'adresse
(`…/#r=<recette>`), qui ne part vers aucun serveur : un tap ouvre l'app sur
la fiche pré-remplie. C'est la forme que renvoie Claude quand on lui colle
une recette dans une session ouverte sur ce dépôt — la marche à suivre est
dans `CLAUDE.md`, il n'y a rien à lui expliquer à chaque fois.

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
| `CLAUDE.md` | notes pour Claude, dont la recette → lien d'import |
| `sw.js` | coquille hors ligne (cache-first, mise à jour en arrière-plan) |
| `manifest.webmanifest` | installation sur l'écran d'accueil |
| `icon-*.png` | icônes générées, panier crème sur fond vert |

## Développement

Aucune étape de build. Pour servir en local :
`python3 -m http.server` à la racine du dépôt. Le service worker et
l'installation sur l'écran d'accueil demandent `http://localhost` ou du HTTPS —
en `file://` l'app fonctionne, mais sans ces deux-là.

Publication : *Settings → Pages → Deploy from a branch → `main` → `/ (root)`*.
