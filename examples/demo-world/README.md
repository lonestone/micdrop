# Micdrop example app : une planète qui en fait trop

Une démo immersive de [Micdrop](../../README.md) : une planète nouvelle-née
écoute une voix, prend tout au premier degré, et s'arrête toujours trop tard.
Client et serveur vivent dans ce dossier.

```bash
cp .env.example .env   # OPENAI_API_KEY, GLADIA_API_KEY, GRADIUM_API_KEY
pnpm dev               # serveur sur 8083, client sur 8082
```

Ouvrez http://localhost:8082 pour l'expérience, et
http://localhost:8082/test.html pour le banc d'essai, qui fonctionne sans micro
ni clé d'API.

## L'idée

Vous ne diagnostiquez rien et vous ne répondez à aucune question. Vous parlez à
quelque chose de très puissant et de très mal élevé. Vous dites « mets de
l'eau », elle en met, puis elle continue, et vous vous retrouvez avec un océan
planétaire et une planète ravie d'elle-même.

Trois principes gouvernent l'écriture, et ils sont dans le prompt
(`src/server/prompt.ts`) :

- **Elle agit avant de parler.** Chaque tour transforme quelque chose. Une
  demande vague est tranchée à votre place, une demande absurde est fabriquée au
  premier degré, et rien n'est jamais refusé.
- **Elle constate, elle ne demande rien.** Une ou deux phrases très courtes,
  aucune question, aucune image. « C'est sec, beaucoup trop sec » contient déjà
  ce qu'il faut faire, et le silence qui suit vous appartient.
- **Rien n'est expliqué.** Aucun mot d'interface, aucune liste de ce qu'on peut
  dire. Elle enseigne son vocabulaire en l'employant, et sa démesure en la
  commettant.

## La mécanique : lui couper la parole

Chaque geste part en deux temps. Le premier arrive tout de suite, le second
quatre secondes et demie plus tard, et il dépasse largement ce qu'on avait
demandé. Pendant ces quatre secondes elle se gonfle et le tremblement monte.

**Parler par-dessus elle annule la seconde moitié.** C'est tout le tutoriel : il
n'y en a pas. On voit quelque chose se charger, on dit « non attends », ça
s'arrête, et on vient de découvrir que l'interruption est un coup jouable.

Ce qui se joue là est simple : chaque geste mené à son terme laisse une trace
sur la planète, chaque coupure l'évite. Une planète qu'on laisse faire devient
ingérable, une planète qu'on coupe reste habitable.

C'est aussi la raison d'être de la démo : le barge-in, la détection d'activité
vocale et la latence de Micdrop ne sont pas illustrés par un paragraphe, ils sont
la condition pour gagner.

## L'arc

Le serveur tient l'histoire, pas le modèle. Avant chaque réponse,
`WorldSession.beforeAnswer` remplace une unique direction de scène en fin de
conversation, qui dit à la planète où elle en est et ce qu'elle doit jouer. La
conversation ne grossit donc jamais d'un message système par tour.

1. **L'étincelle.** Elle s'allume, elle ne sait rien faire, elle guette la
   première voix qu'elle entend.
2. **La démesure.** Chaque demande dérape, chaque dérapage crée le problème
   suivant, et les jauges apparaissent au fur et à mesure des réparations.
3. **La vie.** Quelque chose pousse, quelque chose bouge, elle s'en attribue
   l'entier mérite.
4. **Le culte.** Ils construisent, ils allument des lumières, et ils gravent vos
   phrases dans la pierre en les comprenant de travers. Une catastrophe arrive,
   ils y voient une punition.
5. **L'héritage.** Elle demande un nom, ils le gravent, et son lien devient
   partageable.

## Ce que la civilisation coûte

Les villes poussent toutes seules dès que la faune est installée et que les
conditions tiennent (`src/shared/simulate.ts`). Elles allument sa face nuit, et
elles épaississent son air. Le dernier problème de la partie n'est donc écrit
nulle part : plus ils l'aiment, moins elle respire, et il faut choisir quoi en
faire.

Les commandements, eux, sont vos propres phrases. Le modèle appelle
`carve_commandment` avec une version raccourcie et solennelle de quelque chose
que vous avez dit trente secondes plus tôt, et elle reste affichée jusqu'à la
fin. Rien n'est plus drôle que ses propres mots en majuscules.

## Comment ça tient en si peu de tokens

Le modèle n'émet jamais de géométrie, seulement une poignée de nudges relatifs
(`shape_world({ water: 'much_more' })`). Le navigateur possède un moteur
procédural qui les développe : le relief, les océans, les forêts, les troupeaux,
les nuages, les lumières des villes et la lave sortent tous d'un champ de bruit,
donc une planète habitée tient dans une graine et une douzaine de nombres. C'est
aussi pourquoi le lien de partage contient le monde.

Entre deux phrases, `src/shared/simulate.ts` fait vivre le monde sans rien
générer : l'air fuit vers l'espace, les plantes en refabriquent, la chaleur suit
l'atmosphère, l'eau s'évapore quand il fait trop chaud, les villes s'étendent et
polluent. C'est une fonction pure d'un état de base et du temps écoulé, à pas
fixe, donc le serveur et le navigateur la font tourner chacun de leur côté et
tombent sur les mêmes nombres sans aucune synchronisation.

Les silences coûtent presque rien eux aussi, et ils sont longs. Après
quarante-cinq secondes elle constate quelque chose, après soixante-dix de plus
elle le redit moins patiemment, et ces deux répliques sont écrites d'avance : le code connaît le symptôme dominant, choisit la phrase et
l'envoie directement à la synthèse vocale. La civilisation entière parle de la
même façon (`src/shared/chorus.ts`), pour le prix de l'audio. Seul le troisième
palier dépense une génération.

## Les objectifs apparaissent, ils ne sont jamais annoncés

Une jauge naît la première fois qu'un geste ramène une constante dans sa bande de
confort, comme si réparer ses dégâts avait créé la capacité de les mesurer. Les
bandes se valent mieux que les maximums, les constantes sont couplées, et une
jauge ne dit jamais rien que sa voix n'ait déjà dit.

Les souvenirs (`shared/achievements.ts`) sont nommés après coup, jamais listés à
l'avance, et les meilleurs récompensent une bêtise plutôt qu'une réussite.

## Le banc d'essai

`http://localhost:8082/test.html` monte exactement le même `Experience` que la
page live et le pilote par le même store. Aucun import de Micdrop.

- **Scénario complet.** Les cinq actes joués de bout en bout en une minute
  cinquante, coupure de parole comprise. `?play` le lance au chargement.
- **Outils.** Chaque bouton de `shape_world` joue le geste entier, charge
  comprise, et « la couper » fait ce qu'une voix ferait.
- **États de référence.** Les moments clés de l'arc en un clic, plus le lien de
  partage.
- **Statut, phase, jauges, écritures, souvenirs.** Tout ce que l'interface sait
  afficher. Le seul statut qui se voie est « elle parle », deux coques molles
  qui respirent juste au-dessus de son air : écouter et réfléchir sont des
  silences, et un silence avec un indicateur dedans est un silence que
  quelqu'un presse.
- **Simulation.** Pause et accéléré jusqu'à vingt fois, pour voir les villes
  pousser et l'air s'épaissir sans attendre les minutes réelles.
- `?event=meteor|flare|eruption|freeze` rejoue une catastrophe au chargement, et
  `?surge=charging|overshoot|stopped` rejoue un geste.
- `window.__worldStore` donne la main sur le store depuis la console, pour lire
  ou piloter exactement ce que l'interface lit.

Une note pour qui touchera aux shaders. Ils sont écrits à la main, donc trois
pièges classiques y sont désamorcés et méritent de le rester : `normalMatrix`
n'existe que dans les shaders de sommets, `pow` avec une base négative renvoie
NaN, et un `ShaderMaterial` brut n'applique pas la conversion sRGB de sortie
sans `#include <colorspace_fragment>`. Les trois donnent une planète noire ou
invisible plutôt qu'une erreur lisible.

## Organisation

```
src/shared/    le modèle, la simulation, la démesure, la progression, les répliques
src/server/    fastify, les six outils, l'arc, l'échelle des silences
src/client/    la scène three.js, l'interface, les deux pilotes
```

Le store (`src/client/store/WorldStore.ts`) est le seul contrat : les pilotes
écrivent, les composants lisent, et aucun composant d'interface ne sait d'où
viennent ses données.

## Deux langues

L'écran d'accueil tient en un titre, deux drapeaux et un bouton, et ces deux
drapeaux sont le seul réglage de toute la démo. La langue part au serveur dans
les paramètres d'appel (`waitForParams`), et de là elle sépare ce qui est lu de
ce qui est entendu.

Tout ce que le modèle lit reste en anglais, en un seul exemplaire : le prompt
système, les directions de scène, les descriptions d'outils et le symptôme
courant (`server/prompt.ts`, `shared/needs.ts`). La langue est injectée dans la
seule règle qui décide de ce qui sort de sa bouche, « You speak French », plutôt
que d'entretenir deux prompts qui divergent au premier ajustement.

Tout ce qui est entendu ou affiché est traduit : sa première réplique, les
répliques de silence et celles de la foule (`shared/script.ts`,
`shared/needs.ts`, `shared/chorus.ts`), et les quelques mots de l'interface
(`client/ui/text.ts`). Chaque table est un objet indexé par langue plutôt qu'un
runtime de traduction, parce que le serveur lit exactement les mêmes tables que
le navigateur : une couche i18n qui n'existerait que dans React laisserait sa
voix en français.

Côté fournisseurs, Gladia reçoit la langue de la session et le changement de
code est désactivé, et la synthèse prend la voix `GRADIUM_VOICE_ID_EN` quand
elle existe, sinon la voix française.

## Fournisseurs

OpenAI pour l'agent, Gladia pour la reconnaissance vocale, Gradium pour la
synthèse. Ils sont regroupés dans `src/server/providers.ts` et se remplacent
sans toucher au reste.
