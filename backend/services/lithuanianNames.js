// Official Lithuanian bird names from Lietuvos paukščių sąrašas.
// Keys are Latin binomial names (lowercase for matching).

const names = {
  // Tits (Paridae)
  'parus major': 'Didžioji zylė',
  'cyanistes caeruleus': 'Mėlynoji zylė',
  'parus caeruleus': 'Mėlynoji zylė',
  'periparus ater': 'Juodoji zylė',
  'parus ater': 'Juodoji zylė',
  'lophophanes cristatus': 'Kuoduotoji zylė',
  'parus cristatus': 'Kuoduotoji zylė',
  'poecile palustris': 'Pelkinė zylė',
  'parus palustris': 'Pelkinė zylė',
  'poecile montanus': 'Rudagalvė zylė',
  'parus montanus': 'Rudagalvė zylė',

  // Finches (Fringillidae)
  'pyrrhula pyrrhula': 'Sniegena',
  'fringilla coelebs': 'Kikilis',
  'fringilla montifringilla': 'Šiaurinis kikilis',
  'carduelis carduelis': 'Tikutis',
  'chloris chloris': 'Žaliukas',
  'carduelis chloris': 'Žaliukas',
  'spinus spinus': 'Notrelė',
  'carduelis spinus': 'Notrelė',
  'linaria cannabina': 'Kanapinis guolainis',
  'carduelis cannabina': 'Kanapinis guolainis',
  'acanthis flammea': 'Paprastasis čečeta',
  'carduelis flammea': 'Paprastasis čečeta',
  'acanthis cabaret': 'Mažasis čečeta',
  'loxia curvirostra': 'Kryžiasnapis',
  'loxia pytyopsittacus': 'Pušinis kryžiasnapis',
  'loxia leucoptera': 'Baltasparnė kryžiasnapis',
  'coccothraustes coccothraustes': 'Glotniasnapė',
  'serinus serinus': 'Kanarinis žvirblis',
  'carpodacus erythrinus': 'Raudonasis urvingas',

  // Sparrows (Passeridae)
  'passer domesticus': 'Naminis žvirblis',
  'passer montanus': 'Lauko žvirblis',
  'passer hispaniolensis': 'Ispaninis žvirblis',

  // Thrushes and chats (Turdidae / Muscicapidae)
  'turdus merula': 'Juodasis strazdas',
  'turdus philomelos': 'Giesminis strazdas',
  'turdus viscivorus': 'Žantas',
  'turdus pilaris': 'Klyksnis',
  'turdus iliacus': 'Raudonšonis strazdas',
  'turdus torquatus': 'Juodosios krūtinės strazdas',
  'erithacus rubecula': 'Liepsnelė',
  'luscinia luscinia': 'Lakštingala',
  'luscinia megarhynchos': 'Vakarų lakštingala',
  'luscinia svecica': 'Mėlynagurklė',
  'phoenicurus phoenicurus': 'Miškinė kraujalindė',
  'phoenicurus ochruros': 'Sodybinė kraujalindė',
  'saxicola rubetra': 'Pievinė čia',
  'saxicola rubicola': 'Europinė čia',
  'saxicola torquatus': 'Europinė čia',
  'oenanthe oenanthe': 'Kuolingė',
  'muscicapa striata': 'Pilkasis musinukas',
  'ficedula hypoleuca': 'Margasparnis musinukas',
  'ficedula parva': 'Mažasis musinukas',
  'ficedula albicollis': 'Baltakaklė musinukas',

  // Warblers (Sylviidae / Acrocephalidae / Phylloscopidae)
  'sylvia atricapilla': 'Juodagalvė pečialinda',
  'sylvia borin': 'Sodinė pečialinda',
  'sylvia communis': 'Pilkoji pečialinda',
  'sylvia curruca': 'Mažoji pečialinda',
  'sylvia nisoria': 'Dryžuotoji pečialinda',
  'phylloscopus trochilus': 'Volungėlė',
  'phylloscopus collybita': 'Čiūpelis',
  'phylloscopus sibilatrix': 'Žaliasis pečialandis',
  'phylloscopus inornatus': 'Geltonantakis čiūpelis',
  'acrocephalus scirpaceus': 'Nendrinė nendrinukė',
  'acrocephalus arundinaceus': 'Didysis nendrinukas',
  'acrocephalus palustris': 'Pievinė nendrinukė',
  'acrocephalus schoenobaenus': 'Meldų nendrinukė',
  'locustella naevia': 'Dėmėtasis žiogas',
  'locustella luscinioides': 'Lakštingalinis žiogas',
  'locustella fluviatilis': 'Upinis žiogas',
  'hippolais icterina': 'Gaivalė',
  'iduna opaca': 'Blankioji gaivalė',

  // Kinglets (Regulidae)
  'regulus regulus': 'Karaliukas',
  'regulus ignicapilla': 'Ugninis karaliukas',

  // Wren, Dunnock (Troglodytidae / Prunellidae)
  'troglodytes troglodytes': 'Liputis',
  'prunella modularis': 'Krūminis žiogas',

  // Starlings (Sturnidae)
  'sturnus vulgaris': 'Varnėnas',
  'sturnus unicolor': 'Juodasis varnėnas',

  // Crows (Corvidae)
  'corvus corax': 'Kranklys',
  'corvus cornix': 'Pilkoji varna',
  'corvus corone': 'Juodoji varna',
  'corvus frugilegus': 'Kovas',
  'coloeus monedula': 'Kuosa',
  'corvus monedula': 'Kuosa',
  'pica pica': 'Šarka',
  'garrulus glandarius': 'Sėjikas',
  'nucifraga caryocatactes': 'Riešutinė',
  'perisoreus infaustus': 'Pilkoji sėjakė',

  // Swallows / Martins (Hirundinidae)
  'hirundo rustica': 'Kregždė',
  'delichon urbicum': 'Kregždutė',
  'riparia riparia': 'Krantinė kregždė',
  'cecropis daurica': 'Raudonpilvė kregždė',

  // Swifts (Apodidae)
  'apus apus': 'Čiurlys',
  'apus pallidus': 'Blyškusis čiurlys',
  'apus melba': 'Alpinis čiurlys',

  // Larks (Alaudidae)
  'alauda arvensis': 'Vieversys',
  'lullula arborea': 'Miškinis vieversys',
  'eremophila alpestris': 'Kalnų vieversys',
  'galerida cristata': 'Kuoduotasis vieversys',

  // Wagtails & Pipits (Motacillidae)
  'motacilla alba': 'Baltoji kielė',
  'motacilla flava': 'Geltonoji kielė',
  'motacilla cinerea': 'Kalnų kielė',
  'anthus trivialis': 'Miško kalviukas',
  'anthus pratensis': 'Pievų kalviukas',
  'anthus cervinus': 'Raudongerklė kalviukas',
  'anthus spinoletta': 'Kalnų kalviukas',
  'anthus petrosus': 'Pakrantinis kalviukas',

  // Buntings (Emberizidae)
  'emberiza citrinella': 'Geltonoji starta',
  'emberiza schoeniclus': 'Nendrinis startas',
  'emberiza hortulana': 'Sodinė starta',
  'emberiza rustica': 'Kaimiškas startas',
  'miliaria calandra': 'Dirvinė starta',
  'emberiza calandra': 'Dirvinė starta',
  'plectrophenax nivalis': 'Snieguolė',

  // Woodpeckers (Picidae)
  'dendrocopos major': 'Didysis margasis genys',
  'dendrocopos minor': 'Mažasis margasis genys',
  'dendrocopos medius': 'Vidutinis margasis genys',
  'dendrocopos leucotos': 'Baltanugaris genys',
  'dryocopus martius': 'Juodasis genys',
  'picus viridis': 'Žalioji meleta',
  'picus canus': 'Pilkoji meleta',
  'picoides tridactylus': 'Tripiršis genys',
  'jynx torquilla': 'Sukenis',

  // Cuckoo (Cuculidae)
  'cuculus canorus': 'Gegutė',

  // Hoopoe (Upupidae)
  'upupa epops': 'Dūdutis',

  // Kingfisher, Bee-eater, Roller (Alcedinidae / Meropidae / Coraciidae)
  'alcedo atthis': 'Tulžys',
  'merops apiaster': 'Bitėdis',
  'coracias garrulus': 'Žalvarnė',

  // Owls (Strigidae / Tytonidae)
  'bubo bubo': 'Didysis apuokas',
  'strix aluco': 'Pilkoji pelėda',
  'asio otus': 'Ausytoji pelėda',
  'asio flammeus': 'Pelkinė pelėda',
  'athene noctua': 'Mažoji pelėdikė',
  'tyto alba': 'Klėtinė pelėda',
  'glaucidium passerinum': 'Nykštukinė pelėdikė',
  'aegolius funereus': 'Pelkinis apuokas',
  'surnia ulula': 'Dieninė pelėda',

  // Raptors (Accipitridae / Falconidae / Pandionidae)
  'buteo buteo': 'Suopis',
  'buteo lagopus': 'Šiaurinis suopis',
  'accipiter nisus': 'Vieversinis peslys',
  'accipiter gentilis': 'Paprastasis peslys',
  'pernis apivorus': 'Vapsvanagis',
  'milvus milvus': 'Raudonasis suopas',
  'milvus migrans': 'Juodasis suopas',
  'haliaeetus albicilla': 'Jūrinis erelis',
  'aquila chrysaetos': 'Auksinis erelis',
  'aquila clanga': 'Didysis erelis rėksnys',
  'aquila pomarina': 'Mažasis erelis rėksnys',
  'clanga clanga': 'Didysis erelis rėksnys',
  'clanga pomarina': 'Mažasis erelis rėksnys',
  'circus cyaneus': 'Mėlynasis pelininkas',
  'circus pygargus': 'Pievinė pelininkė',
  'circus aeruginosus': 'Nendrinė pelininkė',
  'circus macrourus': 'Stepinis pelininkas',
  'pandion haliaetus': 'Žuvininkas',
  'falco tinnunculus': 'Pelėsakalis',
  'falco subbuteo': 'Ūsuotasis sakalas',
  'falco peregrinus': 'Keleivinis sakalas',
  'falco columbarius': 'Karveliukinis sakalas',
  'falco vespertinus': 'Vakarinis sakalas',
  'falco rusticolus': 'Gyrfalconas',

  // Pigeons / Doves (Columbidae)
  'columba palumbus': 'Keršulis',
  'columba livia': 'Paprastasis balandis',
  'columba oenas': 'Meldukas',
  'streptopelia turtur': 'Paprastoji purplelė',
  'streptopelia decaocto': 'Purplelė',

  // Gamebirds (Galliformes)
  'tetrao urogallus': 'Kurtinys',
  'lyrurus tetrix': 'Tetervas',
  'tetrao tetrix': 'Tetervas',
  'bonasa bonasia': 'Jerubė',
  'perdix perdix': 'Kurapka',
  'coturnix coturnix': 'Putpelė',
  'phasianus colchicus': 'Fazanas',
  'alectoris rufa': 'Raudonoji kurapka',
  'lagopus lagopus': 'Baltuogė',

  // Rails / Coots (Rallidae)
  'crex crex': 'Griežlė',
  'rallus aquaticus': 'Vandeninis bėgikas',
  'gallinula chloropus': 'Nendrinė vištelė',
  'fulica atra': 'Lysė',
  'porzana porzana': 'Dėmėtoji vištelė',

  // Waders (Charadriiformes)
  'vanellus vanellus': 'Pempė',
  'charadrius dubius': 'Mažasis kirlikas',
  'charadrius hiaticula': 'Paprastasis kirlikas',
  'pluvialis apricaria': 'Auksinė sėjikė',
  'pluvialis squatarola': 'Paprastoji sėjikė',
  'gallinago gallinago': 'Paprastasis snarglys',
  'gallinago media': 'Didysis snarglys',
  'scolopax rusticola': 'Miškinė snarglė',
  'tringa totanus': 'Raudonkojis tulikas',
  'tringa glareola': 'Pievinis tulikas',
  'tringa ochropus': 'Miškinis tulikas',
  'tringa nebularia': 'Žalsvakojis tulikas',
  'actitis hypoleucos': 'Upinis tilvikas',
  'philomachus pugnax': 'Kovotojas',
  'calidris alpina': 'Rudagalvis bėgūnas',
  'calidris pugnax': 'Kovotojas',
  'numenius arquata': 'Didysis kuolingis',
  'numenius phaeopus': 'Vidutinis kuolingis',
  'limosa limosa': 'Juodauodegis bėgikas',
  'limosa lapponica': 'Rausvagurklė bėgikė',
  'arenaria interpres': 'Akmeninis bėgikas',
  'recurvirostra avosetta': 'Avosetas',
  'himantopus himantopus': 'Ilgakojis perkrikšlas',

  // Gulls / Terns (Laridae)
  'larus canus': 'Paprastasis kiras',
  'larus argentatus': 'Sidabrinis kiras',
  'larus fuscus': 'Tamsijuodis kiras',
  'larus marinus': 'Didysis juodanugaris kiras',
  'larus minutus': 'Mažasis kiras',
  'chroicocephalus ridibundus': 'Juodagalvis kiras',
  'larus ridibundus': 'Juodagalvis kiras',
  'hydrocoloeus minutus': 'Mažasis kiras',
  'sterna hirundo': 'Upinė žuvėdra',
  'sterna paradisaea': 'Arktinė žuvėdra',
  'sternula albifrons': 'Mažoji žuvėdra',
  'chlidonias niger': 'Juodoji žuvėdra',
  'chlidonias leucopterus': 'Baltasparnė žuvėdra',
  'chlidonias hybridus': 'Pilkoji žuvėdra',
  'rissa tridactyla': 'Trijapirštis kiras',

  // Auks (Alcidae)
  'alca torda': 'Razorbillas',
  'uria aalge': 'Alkė',

  // Grebes (Podicipedidae)
  'tachybaptus ruficollis': 'Mažasis kragas',
  'podiceps cristatus': 'Kuoduotasis kragas',
  'podiceps grisegena': 'Pilkaskruostis kragas',
  'podiceps auritus': 'Ausytasis kragas',
  'podiceps nigricollis': 'Juodakaklė kragas',

  // Divers / Loons (Gaviidae)
  'gavia stellata': 'Raudongerklė naras',
  'gavia arctica': 'Juodakaklė naras',
  'gavia immer': 'Didysis naras',

  // Cormorants (Phalacrocoracidae)
  'phalacrocorax carbo': 'Paprastasis kormoranas',
  'gulosus aristotelis': 'Kuoduotasis kormoranas',

  // Herons (Ardeidae)
  'ardea cinerea': 'Pilkasis garnys',
  'ardea alba': 'Didžioji baltoji gardena',
  'egretta alba': 'Didžioji baltoji gardena',
  'egretta garzetta': 'Mažoji baltoji gardena',
  'nycticorax nycticorax': 'Naktinis garnys',
  'ixobrychus minutus': 'Mažasis baublys',
  'botaurus stellaris': 'Baublys',

  // Storks (Ciconiidae)
  'ciconia ciconia': 'Baltasis gandras',
  'ciconia nigra': 'Juodasis gandras',

  // Cranes (Gruidae)
  'grus grus': 'Pilkasis gervė',

  // Swans, Geese, Ducks (Anatidae)
  'cygnus olor': 'Nebylė gulbė',
  'cygnus cygnus': 'Giedotoji gulbė',
  'cygnus columbianus': 'Mažoji gulbė',
  'anser anser': 'Pilkoji žąsis',
  'anser fabalis': 'Pupinė žąsis',
  'anser albifrons': 'Baltakaktė žąsis',
  'anser brachyrhynchus': 'Trumpasnapė žąsis',
  'branta leucopsis': 'Baltaskruostė berniklė',
  'branta canadensis': 'Kanadinė berniklė',
  'branta bernicla': 'Juodoji berniklė',
  'tadorna tadorna': 'Margoji antis',
  'anas platyrhynchos': 'Laukinė antis',
  'anas crecca': 'Mažoji kryklė',
  'anas acuta': 'Karvelė antis',
  'anas querquedula': 'Rudakaklis kriklys',
  'anas clypeata': 'Šaukštasnapė antis',
  'anas penelope': 'Švilpikė antis',
  'anas strepera': 'Pilkoji antis',
  'mareca penelope': 'Švilpikė antis',
  'mareca strepera': 'Pilkoji antis',
  'spatula clypeata': 'Šaukštasnapė antis',
  'spatula querquedula': 'Rudakaklis kriklys',
  'aythya fuligula': 'Kuoduotoji antis',
  'aythya ferina': 'Rudagalvė antis',
  'aythya marila': 'Didžioji antis',
  'aythya nyroca': 'Rudoji antis',
  'bucephala clangula': 'Grigotas',
  'mergus merganser': 'Didysis dančiasnapė',
  'mergus serrator': 'Šiaurinis dančiasnapė',
  'mergellus albellus': 'Mažasis dančiasnapė',
  'melanitta nigra': 'Juodoji antis',
  'melanitta fusca': 'Rudoji jūrinė antis',
  'clangula hyemalis': 'Ledyninė antis',
  'somateria mollissima': 'Paprastoji pūkonė',
  'netta rufina': 'Raudonvainike antis',

  // Waxwing (Bombycillidae)
  'bombycilla garrulus': 'Svilikas',

  // Treecreepers / Nuthatches (Certhiidae / Sittidae)
  'sitta europaea': 'Pelėšarka',
  'certhia familiaris': 'Mediakirtė',
  'certhia brachydactyla': 'Sodybinė mediakirtė',

  // Oriole (Oriolidae)
  'oriolus oriolus': 'Volungė',

  // Shrikes (Laniidae)
  'lanius collurio': 'Paprastasis medšarkis',
  'lanius excubitor': 'Didysis medšarkis',
  'lanius minor': 'Mažasis medšarkis',

  // Dipper (Cinclidae)
  'cinclus cinclus': 'Vandeninis strazdas',
};

export { names as staticNames };
