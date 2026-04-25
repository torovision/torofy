// TOROFY Internationalization (i18n)
const translations = {
  en: {
    // Sidebar
    home: 'Home',
    search: 'Search',
    yourLibrary: 'Your Library',
    createPlaylist: 'Create Playlist',
    likedSongs: 'Liked Songs',
    madeWith: 'Made with',
    by: 'by',
    logOut: 'Log Out',
    
    // Auth
    logIn: 'Log In',
    signUp: 'Sign Up',
    email: 'Email address',
    password: 'Password',
    username: 'Username',
    pleaseWait: 'Please wait...',
    continueWithGoogle: 'Continue with Google',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signUpForTorofy: 'Sign up for TOROFY',
    logInHere: 'Log in here',
    fillAllFields: 'Please fill in all fields.',
    emailExists: 'Email already exists.',
    invalidCredentials: 'Invalid email or password.',
    weakPassword: 'Password should be at least 6 characters.',
    invalidEmail: 'Invalid email address.',
    googleFailed: 'Google sign-in failed. Please try again.',
    or: 'or',

    // Main
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    recommendedForYou: 'Recommended for You',
    generatingRecs: 'Generating your custom recommendations...',
    featuredPopHits: 'Featured Pop Hits',
    becauseYouLike: 'Because you like',
    moreFrom: 'More from',
    loading: 'Loading...',

    // Search
    whatToListen: 'What do you want to listen to?',
    searching: 'Searching...',
    topResult: 'Top Result',
    artist: 'Artist',
    songs: 'Songs',
    recentSearches: 'Recent Searches',
    searchPlaceholder: 'Search for songs, artists, or podcasts',
    noResults: 'No results found for',

    // Player
    lyrics: 'Lyrics',
    lyricsFor: 'Lyrics for',
    loadingLyrics: 'Loading lyrics...',
    noLyrics: 'Lyrics not found.',

    // Library
    offlineLibrary: 'Offline Library',
    localFiles: 'Local Files',
    songsSavedOffline: 'songs saved offline',
    songSavedOffline: 'song saved offline',
    loadingOffline: 'Loading your offline library...',
    noOfflineSongs: 'No offline songs yet',
    noOfflineDesc: 'Download songs from Search or Liked Songs to listen offline.',
    removeOffline: 'Remove from offline',
    offline: 'OFFLINE',

    // Liked Songs
    likedSongsTitle: 'Liked Songs',

    // Playlist
    enterPlaylistName: 'Enter Playlist Name:',
    addToPlaylist: 'Add to Playlist',
    noPlaylists: "You don't have any playlists yet! Create one in the sidebar first.",
    enterPlaylistNumber: 'Enter the number of the playlist to add this song to:',
    addedTo: 'Added to',
    alreadyInPlaylist: 'Song is already in this playlist.',
    saveToLiked: 'Save to Liked Songs',
    saveToLibrary: 'Save to Library',
    downloadFailed: 'Download failed. Please try again.',
    
    // Artist
    popularTracks: 'Popular Tracks',
    playlists: 'Playlists',
    playAll: 'Play All',
    subscribers: 'subscribers',

    // Language
    language: 'Language',
  },

  fr: {
    home: 'Accueil',
    search: 'Rechercher',
    yourLibrary: 'Votre Bibliothèque',
    createPlaylist: 'Créer une playlist',
    likedSongs: 'Titres likés',
    madeWith: 'Fait avec',
    by: 'par',
    logOut: 'Déconnexion',
    
    logIn: 'Se connecter',
    signUp: "S'inscrire",
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    username: "Nom d'utilisateur",
    pleaseWait: 'Veuillez patienter...',
    continueWithGoogle: 'Continuer avec Google',
    dontHaveAccount: "Vous n'avez pas de compte ?",
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    signUpForTorofy: "S'inscrire sur TOROFY",
    logInHere: 'Se connecter ici',
    fillAllFields: 'Veuillez remplir tous les champs.',
    emailExists: 'Cette adresse e-mail existe déjà.',
    invalidCredentials: 'E-mail ou mot de passe invalide.',
    weakPassword: 'Le mot de passe doit contenir au moins 6 caractères.',
    invalidEmail: 'Adresse e-mail invalide.',
    googleFailed: 'Connexion Google échouée. Veuillez réessayer.',
    or: 'ou',

    goodMorning: 'Bonjour',
    goodAfternoon: 'Bon après-midi',
    goodEvening: 'Bonsoir',
    recommendedForYou: 'Recommandé pour vous',
    generatingRecs: 'Génération de vos recommandations...',
    featuredPopHits: 'Hits Pop en vedette',
    becauseYouLike: 'Parce que vous aimez',
    moreFrom: 'Plus de',
    loading: 'Chargement...',

    whatToListen: "Qu'est-ce que vous voulez écouter ?",
    searching: 'Recherche...',
    topResult: 'Meilleur résultat',
    artist: 'Artiste',
    songs: 'Titres',
    recentSearches: 'Recherches récentes',
    searchPlaceholder: 'Rechercher des titres, artistes ou podcasts',
    noResults: 'Aucun résultat trouvé pour',

    lyrics: 'Paroles',
    lyricsFor: 'Paroles de',
    loadingLyrics: 'Chargement des paroles...',
    noLyrics: 'Paroles non trouvées.',

    offlineLibrary: 'Bibliothèque hors ligne',
    localFiles: 'Fichiers locaux',
    songsSavedOffline: 'titres sauvegardés hors ligne',
    songSavedOffline: 'titre sauvegardé hors ligne',
    loadingOffline: 'Chargement de votre bibliothèque hors ligne...',
    noOfflineSongs: 'Aucun titre hors ligne',
    noOfflineDesc: 'Téléchargez des titres depuis Recherche ou Titres likés pour écouter hors ligne.',
    removeOffline: 'Supprimer du hors ligne',
    offline: 'HORS LIGNE',

    likedSongsTitle: 'Titres likés',

    enterPlaylistName: 'Nom de la playlist :',
    addToPlaylist: 'Ajouter à la playlist',
    noPlaylists: "Vous n'avez pas encore de playlist ! Créez-en une dans la barre latérale.",
    enterPlaylistNumber: 'Entrez le numéro de la playlist pour ajouter ce titre :',
    addedTo: 'Ajouté à',
    alreadyInPlaylist: 'Ce titre est déjà dans cette playlist.',
    saveToLiked: 'Sauvegarder dans les Titres likés',
    saveToLibrary: 'Sauvegarder dans la Bibliothèque',
    downloadFailed: 'Téléchargement échoué. Veuillez réessayer.',

    popularTracks: 'Titres populaires',
    playlists: 'Playlists',
    playAll: 'Tout lire',
    subscribers: 'abonnés',

    language: 'Langue',
  },

  ar: {
    home: 'الرئيسية',
    search: 'بحث',
    yourLibrary: 'مكتبتك',
    createPlaylist: 'إنشاء قائمة تشغيل',
    likedSongs: 'الأغاني المفضلة',
    madeWith: 'صنع بـ',
    by: 'بواسطة',
    logOut: 'تسجيل الخروج',
    
    logIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    username: 'اسم المستخدم',
    pleaseWait: '...يرجى الانتظار',
    continueWithGoogle: 'المتابعة مع جوجل',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    signUpForTorofy: 'سجّل في TOROFY',
    logInHere: 'سجّل الدخول هنا',
    fillAllFields: 'يرجى ملء جميع الحقول.',
    emailExists: 'البريد الإلكتروني مستخدم بالفعل.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    weakPassword: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    invalidEmail: 'بريد إلكتروني غير صالح.',
    googleFailed: 'فشل تسجيل الدخول بجوجل. حاول مرة أخرى.',
    or: 'أو',

    goodMorning: 'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening: 'مساء الخير',
    recommendedForYou: 'موصى لك',
    generatingRecs: '...جاري إنشاء توصياتك',
    featuredPopHits: 'أغاني بوب مميزة',
    becauseYouLike: 'لأنك تحب',
    moreFrom: 'المزيد من',
    loading: '...جاري التحميل',

    whatToListen: 'ماذا تريد أن تسمع؟',
    searching: '...جاري البحث',
    topResult: 'أفضل نتيجة',
    artist: 'فنان',
    songs: 'أغاني',
    recentSearches: 'عمليات البحث الأخيرة',
    searchPlaceholder: 'ابحث عن أغاني أو فنانين أو بودكاست',
    noResults: 'لا توجد نتائج لـ',

    lyrics: 'كلمات',
    lyricsFor: 'كلمات',
    loadingLyrics: '...جاري تحميل الكلمات',
    noLyrics: 'لم يتم العثور على كلمات.',

    offlineLibrary: 'المكتبة بدون إنترنت',
    localFiles: 'ملفات محلية',
    songsSavedOffline: 'أغاني محفوظة بدون إنترنت',
    songSavedOffline: 'أغنية محفوظة بدون إنترنت',
    loadingOffline: '...جاري تحميل مكتبتك',
    noOfflineSongs: 'لا توجد أغاني محفوظة',
    noOfflineDesc: 'حمّل أغاني من البحث أو المفضلة للاستماع بدون إنترنت.',
    removeOffline: 'إزالة من المحفوظات',
    offline: 'محفوظ',

    likedSongsTitle: 'الأغاني المفضلة',

    enterPlaylistName: ':اسم قائمة التشغيل',
    addToPlaylist: 'إضافة إلى قائمة التشغيل',
    noPlaylists: 'ليس لديك قوائم تشغيل بعد! أنشئ واحدة من الشريط الجانبي.',
    enterPlaylistNumber: ':أدخل رقم قائمة التشغيل لإضافة هذه الأغنية',
    addedTo: 'أُضيف إلى',
    alreadyInPlaylist: 'الأغنية موجودة بالفعل في هذه القائمة.',
    saveToLiked: 'حفظ في المفضلة',
    saveToLibrary: 'حفظ في المكتبة',
    downloadFailed: 'فشل التحميل. حاول مرة أخرى.',

    popularTracks: 'الأغاني الشائعة',
    playlists: 'قوائم التشغيل',
    playAll: 'تشغيل الكل',
    subscribers: 'مشترك',

    language: 'اللغة',
  },

  es: {
    home: 'Inicio',
    search: 'Buscar',
    yourLibrary: 'Tu Biblioteca',
    createPlaylist: 'Crear playlist',
    likedSongs: 'Canciones que te gustan',
    madeWith: 'Hecho con',
    by: 'por',
    logOut: 'Cerrar sesión',

    logIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    username: 'Nombre de usuario',
    pleaseWait: 'Por favor espera...',
    continueWithGoogle: 'Continuar con Google',
    dontHaveAccount: '¿No tienes una cuenta?',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    signUpForTorofy: 'Regístrate en TOROFY',
    logInHere: 'Inicia sesión aquí',
    fillAllFields: 'Por favor completa todos los campos.',
    emailExists: 'El correo electrónico ya existe.',
    invalidCredentials: 'Correo o contraseña inválidos.',
    weakPassword: 'La contraseña debe tener al menos 6 caracteres.',
    invalidEmail: 'Correo electrónico inválido.',
    googleFailed: 'Inicio de sesión con Google fallido. Inténtalo de nuevo.',
    or: 'o',

    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    recommendedForYou: 'Recomendado para ti',
    generatingRecs: 'Generando tus recomendaciones...',
    featuredPopHits: 'Éxitos Pop destacados',
    becauseYouLike: 'Porque te gusta',
    moreFrom: 'Más de',
    loading: 'Cargando...',

    whatToListen: '¿Qué quieres escuchar?',
    searching: 'Buscando...',
    topResult: 'Mejor resultado',
    artist: 'Artista',
    songs: 'Canciones',
    recentSearches: 'Búsquedas recientes',
    searchPlaceholder: 'Buscar canciones, artistas o podcasts',
    noResults: 'No se encontraron resultados para',

    lyrics: 'Letra',
    lyricsFor: 'Letra de',
    loadingLyrics: 'Cargando letra...',
    noLyrics: 'Letra no encontrada.',

    offlineLibrary: 'Biblioteca sin conexión',
    localFiles: 'Archivos locales',
    songsSavedOffline: 'canciones guardadas sin conexión',
    songSavedOffline: 'canción guardada sin conexión',
    loadingOffline: 'Cargando tu biblioteca sin conexión...',
    noOfflineSongs: 'Sin canciones sin conexión',
    noOfflineDesc: 'Descarga canciones desde Buscar o Me gusta para escuchar sin conexión.',
    removeOffline: 'Eliminar de sin conexión',
    offline: 'SIN CONEXIÓN',

    likedSongsTitle: 'Canciones que te gustan',

    enterPlaylistName: 'Nombre de la playlist:',
    addToPlaylist: 'Añadir a playlist',
    noPlaylists: '¡Aún no tienes playlists! Crea una en la barra lateral.',
    enterPlaylistNumber: 'Ingresa el número de la playlist para añadir esta canción:',
    addedTo: 'Añadido a',
    alreadyInPlaylist: 'La canción ya está en esta playlist.',
    saveToLiked: 'Guardar en Me gusta',
    saveToLibrary: 'Guardar en Biblioteca',
    downloadFailed: 'Descarga fallida. Inténtalo de nuevo.',

    popularTracks: 'Canciones populares',
    playlists: 'Playlists',
    playAll: 'Reproducir todo',
    subscribers: 'suscriptores',

    language: 'Idioma',
  },

  de: {
    home: 'Startseite',
    search: 'Suche',
    yourLibrary: 'Deine Bibliothek',
    createPlaylist: 'Playlist erstellen',
    likedSongs: 'Lieblingssongs',
    madeWith: 'Gemacht mit',
    by: 'von',
    logOut: 'Abmelden',

    logIn: 'Anmelden',
    signUp: 'Registrieren',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    username: 'Benutzername',
    pleaseWait: 'Bitte warten...',
    continueWithGoogle: 'Weiter mit Google',
    dontHaveAccount: 'Noch kein Konto?',
    alreadyHaveAccount: 'Bereits ein Konto?',
    signUpForTorofy: 'Bei TOROFY registrieren',
    logInHere: 'Hier anmelden',
    fillAllFields: 'Bitte fülle alle Felder aus.',
    emailExists: 'E-Mail existiert bereits.',
    invalidCredentials: 'Ungültige E-Mail oder Passwort.',
    weakPassword: 'Passwort muss mindestens 6 Zeichen lang sein.',
    invalidEmail: 'Ungültige E-Mail-Adresse.',
    googleFailed: 'Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    or: 'oder',

    goodMorning: 'Guten Morgen',
    goodAfternoon: 'Guten Tag',
    goodEvening: 'Guten Abend',
    recommendedForYou: 'Für dich empfohlen',
    generatingRecs: 'Deine Empfehlungen werden generiert...',
    featuredPopHits: 'Ausgewählte Pop-Hits',
    becauseYouLike: 'Weil du magst',
    moreFrom: 'Mehr von',
    loading: 'Laden...',

    whatToListen: 'Was möchtest du hören?',
    searching: 'Suche...',
    topResult: 'Top-Ergebnis',
    artist: 'Künstler',
    songs: 'Songs',
    recentSearches: 'Letzte Suchen',
    searchPlaceholder: 'Songs, Künstler oder Podcasts suchen',
    noResults: 'Keine Ergebnisse gefunden für',

    lyrics: 'Songtext',
    lyricsFor: 'Songtext von',
    loadingLyrics: 'Songtext wird geladen...',
    noLyrics: 'Songtext nicht gefunden.',

    offlineLibrary: 'Offline-Bibliothek',
    localFiles: 'Lokale Dateien',
    songsSavedOffline: 'Songs offline gespeichert',
    songSavedOffline: 'Song offline gespeichert',
    loadingOffline: 'Deine Offline-Bibliothek wird geladen...',
    noOfflineSongs: 'Keine Offline-Songs',
    noOfflineDesc: 'Lade Songs aus der Suche oder Lieblingssongs herunter, um sie offline zu hören.',
    removeOffline: 'Aus Offline entfernen',
    offline: 'OFFLINE',

    likedSongsTitle: 'Lieblingssongs',

    enterPlaylistName: 'Playlist-Name:',
    addToPlaylist: 'Zur Playlist hinzufügen',
    noPlaylists: 'Du hast noch keine Playlists! Erstelle eine in der Seitenleiste.',
    enterPlaylistNumber: 'Gib die Nummer der Playlist ein, um diesen Song hinzuzufügen:',
    addedTo: 'Hinzugefügt zu',
    alreadyInPlaylist: 'Song ist bereits in dieser Playlist.',
    saveToLiked: 'In Lieblingssongs speichern',
    saveToLibrary: 'In Bibliothek speichern',
    downloadFailed: 'Download fehlgeschlagen. Bitte erneut versuchen.',

    popularTracks: 'Beliebte Songs',
    playlists: 'Playlists',
    playAll: 'Alle abspielen',
    subscribers: 'Abonnenten',

    language: 'Sprache',
  }
};

// Language names for the selector UI
export const languageNames = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  es: 'Español',
  de: 'Deutsch'
};

// Detect browser/device language
export function detectLanguage() {
  const stored = localStorage.getItem('torofy_language');
  if (stored && translations[stored]) return stored;
  
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const shortLang = browserLang.split('-')[0].toLowerCase();
  return translations[shortLang] ? shortLang : 'en';
}

// Get translation function
export function t(key, lang) {
  const currentLang = lang || detectLanguage();
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

export default translations;
