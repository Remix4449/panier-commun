# Panier Commun — notes pour Claude

Application de courses et de repas, une seule page (`index.html`), aucune
dépendance, aucun build. Publiée par GitHub Pages sur
<https://remix4449.github.io/panier-commun/>.

## La demande la plus fréquente : « ajoute cette recette »

Quand une recette est collée dans la conversation — texte d'un site, photo
retranscrite, recette que tu viens d'écrire — et qu'on te demande de
l'ajouter à Panier Commun : **réponds avec un lien d'import, en une fois,
sans poser de question.**

La recette voyage dans le fragment de l'adresse : elle ne part vers aucun
serveur, il n'y a rien à configurer, rien à committer, et un seul geste à
faire côté téléphone. Ne touche pas à `STARTERS` dans `index.html` : c'est
le carnet du foyer reporté depuis Notion, il garnit une installation neuve,
il n'accueille pas une recette de passage. Ne demande jamais l'adresse de la
base Firebase ni le code du foyer.

Le geste, en trois temps.

**1. Mettre la recette en forme.** Un objet par recette :

| champ | type | notes |
| --- | --- | --- |
| `name` | texte | obligatoire, le titre tel qu'il s'affichera |
| `category` | texte | celle du carnet quand elle colle — `Healthy`, `Plaisir` — sinon `Plat`, `Entrée`, `Dessert`, `Petit-déj`, `Apéro`, `Accompagnement` |
| `servings` | entier | nombre de personnes de la recette d'origine (1 à 30) |
| `minutes` | entier | durée totale, en minutes |
| `ingredients` | liste | `{"name": …, "qty": …, "unit": …}` |
| `steps` | liste de textes | une étape par entrée, sans numérotation |

Pour les ingrédients : `qty` est un nombre (`0.5`, pas `"½"`), `unit` une
unité courte et sans point (`g`, `kg`, `ml`, `cl`, `l`, `cs`, `cc`,
`pincée`, `gousse`, `tranche`, `boîte`, `sachet`, `botte`…), vide quand
l'ingrédient se compte à l'unité (`{"name":"Œufs","qty":3,"unit":""}`).
`name` porte l'ingrédient seul, sans article ni préparation : « Lardons
fumés », pas « 200 g de lardons fumés », pas « oignon émincé ». Omets un
champ que tu ne connais pas plutôt que d'écrire `null`. Le rayon est trouvé
par l'app (`PRODUITS` d'abord, `GUESS` ensuite), ne le renseigne pas.

**2. Fabriquer le lien.**

```bash
python3 - <<'RECETTE'
import base64, json
recette = {
  "name": "Tarte aux poireaux et lardons",
  "category": "Plat",
  "servings": 6,
  "minutes": 55,
  "ingredients": [
    {"name": "Pâte brisée", "qty": 1, "unit": ""},
    {"name": "Poireaux", "qty": 4, "unit": ""},
    {"name": "Lardons fumés", "qty": 200, "unit": "g"},
  ],
  "steps": [
    "Émincer les poireaux et les faire fondre 15 min à la poêle.",
    "Garnir la pâte et enfourner 35 min à 180 °C.",
  ],
}
data = json.dumps(recette, ensure_ascii=False, separators=(",", ":")).encode()
print("https://remix4449.github.io/panier-commun/#r=" +
      base64.urlsafe_b64encode(data).decode().rstrip("="))
RECETTE
```

Plusieurs recettes d'un coup : mets une **liste** d'objets à la place de
l'objet, le reste ne change pas.

**3. Répondre.** Le lien, et une ligne qui dit ce qu'il contient — le nom,
le nombre de personnes, le nombre d'ingrédients. Rien d'autre : pas de JSON
dans la réponse, pas de mode d'emploi. Un tap sur le lien ouvre l'app sur
la fiche pré-remplie ; « Enregistrer » la range dans les recettes et la
synchronise avec l'autre téléphone.

Si le lien est refusé quelque part (messagerie qui le mange, copier-coller
impossible), la porte de secours est le bouton ↓ de l'écran Recettes :
il accepte le texte brut de la recette, un lien, ou le JSON ci-dessus.

Réimporter une recette déjà présente **ne crée pas de doublon** : à nom
identique, la fiche est mise à jour, et ses ingrédients sont recalculés
dans les courses si elle y était.

## Le code

Tout est dans `index.html` : styles, markup, logique, dans une IIFE. Pas de
build, pas de test runner, pas de dépendance — et rien de tout cela n'est
souhaitable ici.

- `save(col, id, body)` / `drop(col, id)` écrivent une collection
  (`recipes`, `shopping`, `plan`, `rayons`, `pantry`) : localStorage
  d'abord, puis file d'attente vers Firebase si un foyer est configuré.
  Tout passe par là, jamais par `localData` directement.
- Une ligne de courses est retrouvée par `findItemId()`, jamais par
  `itemId()` seul : `itemKey()` rapproche les écritures d'un même article
  (pluriel, ligatures, ponctuation, unité dite autrement) pour que deux
  recettes grossissent la même ligne au lieu d'en ouvrir deux.
  `fuseDuplicates()` fond les doublons déjà en place — au démarrage et à
  chaque arrivée de l'autre téléphone ; il garde toujours le plus petit
  identifiant du groupe, ce qui fait converger les deux téléphones.
- Le filtre « Semaine » de l'écran Recettes vit dans `state.week` (retenu
  dans `panier.ui.v1`) : `weekCounts()` compte les repas par recette,
  `recipesBase()` applique le filtre entre la recherche et les catégories.
  Une recette posée sur plusieurs repas ne verse ses ingrédients qu'une
  fois — `sources` est indexé par recette, pas par repas.
- `pantry` est la mémoire des articles ajoutés à la volée — nom, unité,
  rayon corrigé. Elle sert les suggestions de la barre d'ajout et survit à
  la purge de la liste ; `remember()` l'alimente, plafonnée à 240 entrées.
- Ce qui est propre à un téléphone — onglet ouvert, position dans la page,
  catégories de recettes repliées — vit à part dans `panier.ui.v1`
  (`loadUI()` / `saveUI()`), jamais dans les collections partagées.
- L'import vit sous l'intertitre `/* --- import --- */` du script :
  `parseRecipes()` avale un lien, du JSON ou du texte libre et rend des
  recettes normalisées ; `openRecipeForm(id, brouillon)` les affiche pour
  relecture ; `saveImported()` enregistre sans relecture (bouton « Tout
  ajouter »).
- `PRODUITS` (les aliments du foyer, par rayon) alimente `PRODUIT_RAYON`,
  que `guessRayon()` consulte avant ses mots-clés : un ingrédient du carnet
  est rangé sans devinette.
- Après toute modification de `index.html`, incrémente `CACHE` dans
  `sw.js` (`panier-v4` → `panier-v5`) : sans ça, les téléphones déjà
  installés gardent l'ancienne page dans le cache de la coquille.
- Le français de l'interface est soigné : phrases complètes, apostrophes
  typographiques (’) dans le texte visible, tutoiement jamais, majuscules
  sobres. Les commentaires du code sont en français eux aussi.

Pour essayer en local : `python3 -m http.server` à la racine, puis
<http://localhost:8000/>. Le service worker et l'installation sur l'écran
d'accueil demandent `http://localhost` ou du HTTPS.
