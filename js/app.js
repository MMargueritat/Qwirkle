/* ------------------------------------QWIRKLE------------------------------------ */

function regles_page(n) {
    document.getElementById("img_regles1").style.display="none";
    document.getElementById("img_regles2").style.display="none";
    document.getElementById("img_regles3").style.display="none";
    document.getElementById("help_page1").style.background="transparent";
    document.getElementById("help_page2").style.background="transparent";
    document.getElementById("help_page3").style.background="transparent";
    document.getElementById("img_regles"+n).style.display="block";
    document.getElementById("help_page"+n).style.background="#8679DC";
}

function regles_show(b){
    regles_page("1");
    if(b){
        document.getElementById("regles").style.display = "block";
    } else {
        document.getElementById("regles").style.display = "none";
    }
}

// Utilitaires

const notify = function(msg, seconds=3) {
    $('#notification p').html(msg);
    $('#notification').fadeIn(300);
    setTimeout(function() {
       $('#notification').fadeOut(300);
    },1000*seconds);
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

var BASE_URL = "https://www.dekefake.duckdns.org:63551";

// TODO : API
async function sauvegarder() {
    var _partie_data = {
        'plateau_jeu': plateau_jeu,
        'tab_joueurs': tab_joueurs,
        'joueurActif': joueurActif,
        'partie_id': partie_id,
        'sac_pions': sac_pions,
        'partieCommencee': partieCommencee
    }
    var payload = JSON.stringify(_partie_data);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", BASE_URL+"/sauvegarder", false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(payload);
    return xhr.response;
}

async function SUPPRIMER_PARTIES_API() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", BASE_URL+"/supprimerparties/", false);
    xmlHttp.send();
    return xmlHttp.responseText;
}

async function touteslesparties(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", BASE_URL+"/touteslesparties/", false);
    xmlHttp.send();
    var response = xmlHttp.responseText;
    response = JSON.parse(response);
    response = new Map(Object.entries(response));
    var _html = '<div id="parties_liste">';
    _html += '<h2>Selectionnez votre partie</h2>';
    _html += '<p id="parties_liste_abort">X</p>';
    _html+='<div id="parties_liste_item"><div>ID de Partie</div><div>Joueur 1</div><div>Joueur 2</div><div>Joueur 3</div><div>Joueur 4</div></div>';
    for(const _p of response.keys()){
        var partie = response.get(_p);
        _html += ('<div id="parties_liste_item"><div class="parties_liste_id">'+_p+'</div>');
        for(var _i=0;_i<4;_i++){
            if(_i<partie.tab_joueurs.length){
                var _j = partie.tab_joueurs[_i];
                _html+= ("<div>"+_j.nom+" : "+_j.score+"</div>");
            } else {
                _html += "<div>/</div>";
            }
        }
        _html+="</div>";
    }
    _html+="</div>";
    notify(_html,3600);
    inject_parties_liste();
}

async function charger_partie(pt_id) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", BASE_URL+"/chargerpartie/"+pt_id, false);
    xmlHttp.send();
    var response = xmlHttp.responseText;
    response = JSON.parse(response);
    
    // Charger plateau 
    plateau_jeu = {};
    var _tmp_plateau = response['plateau_jeu'];
    _tmp_plateau = new Map(Object.entries(_tmp_plateau));
    for(const _case of _tmp_plateau.keys()){
        var forme = _tmp_plateau.get(_case).forme;
        var couleur = _tmp_plateau.get(_case).couleur;
        plateau_jeu[_case] = new Pion(forme, couleur);
    }

    tab_joueurs = [];
    var _tmp_tab_joueurs = response['tab_joueurs'];
    _tmp_tab_joueurs = new Map(Object.entries(_tmp_tab_joueurs));
    for(const _key of _tmp_tab_joueurs.keys()){
        var nom = _tmp_tab_joueurs.get(_key).nom;
        var id = _tmp_tab_joueurs.get(_key).id;
        var score = _tmp_tab_joueurs.get(_key).score;
        var pions = _tmp_tab_joueurs.get(_key).pions.map(p => new Pion(p.forme, p.couleur));
        var _j = new Joueur(nom,id);
        _j.score = score;
        _j.pions = pions;
        tab_joueurs.push(_j);
    }

    joueurActif = response['joueurActif'];
    partie_id = response['partie_id'];
    sac_pions = response['sac_pions'].map(p => new Pion(p.forme, p.couleur));
    partieCommencee = response['partieCommencee'];

    generer_ui_joueurs(tab_joueurs.length,false);
    interface_graphique();
}


document.getElementById("help_page1").addEventListener("click", function(){regles_page('1')});
document.getElementById("help_page2").addEventListener("click", function(){regles_page('2')});
document.getElementById("help_page3").addEventListener("click", function(){regles_page('3')});
document.getElementById("help_close").addEventListener("click", function(){regles_show(false)});
document.getElementById("help_panel").addEventListener("click", function(){regles_show(true)});



/* ------------------------------------ */
/*         DEFINITIONS D'OBJETS         */
/* ------------------------------------ */

// Objet Pion
class Pion {
    constructor(forme, couleur) {
      this.forme = forme;
      this.couleur = couleur;
    }
    toString(){
        return this.forme + "_" + this.couleur;
    }
}

// Objet Joueur
class Joueur {
    constructor(nom,id) {
        this.nom = nom;
        this.id = id;
        this.score = 0;
        this.pions = [];
    }
}

/* ------------------------------------ */
/*           FONCTIONS DU JEU           */
/* ------------------------------------ */

// Mélanger un tableau
function melanger(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// Remplit le sac de pions selon les pions disponibles au Qwirkle :
// - Toutes les combinaisons de forme et de couleur (36 combinaisons)
// - 3 exemplaires de chaque pion (Soit 108 pions au total)
// !! Le sac de pions est reconstruit de zero !!
function remplir_sac_pions(){
    sac_pions = []; 
    for (const forme of formes) {
        for (const couleur of couleurs) {
            sac_pions.push(new Pion(forme,couleur));
            sac_pions.push(new Pion(forme,couleur));
            sac_pions.push(new Pion(forme,couleur));
        }
    }
    // On mélange les pions 2 fois (on sait jamais !! Anti tricheurs !! )
    melanger(sac_pions);
    melanger(sac_pions);
}

// Retourne l'image associée à un pion au format CSS img()
function image_du_pion(pion){
    return 'url(images/'+pion.forme+pion.couleur+'.png)';
}

// Fonction de mise à jour de l'interface graphique
// Reconstruit la grille de jeu et les pions des joueurs en fonction des données internes du jeu
function interface_graphique(){

    // Etape 1 : Afficher les pions des joueurs
    for (const [idx_joueur,j] of tab_joueurs.entries()){
        for(const [idx_pion,p] of j.pions.entries()){
            element = document.getElementById('j'+idx_joueur +'_'+idx_pion);
            element.style.backgroundImage = image_du_pion(p);
        }
    }

    // Etape 2 : Afficher les pions du plateau
    var pions_plateau = document.querySelectorAll('#plateau td');
    
    // Etape 2a : Effacer tous les pions
    for (const pion of pions_plateau){
        pion.style.backgroundImage = '';
        pion.style.opacity='';
    }

    // Etape 2b : Afficher les pions du plateau
    for(const coordonnee_pion of Object.entries(plateau_jeu)){
        // On récupère le <td> qui correspond aux coordonnees du pion contenus dans coordonnee_pion[0]
        case_plateau = document.querySelectorAll('#plateau_'+coordonnee_pion[0])[0];
        // On ajoute l'image au <td> selon le contenu du pion
        case_plateau.style.backgroundImage = image_du_pion(coordonnee_pion[1]);
        case_plateau.style.opacity = '1';
    }

    var z = document.querySelectorAll('div[id^="piecesJoueurs"]:not(#piecesJoueurs'+joueurActif+')');
    z.forEach(function(element) {
        element.classList.add("disabled");
    });

    document.getElementById('piecesJoueurs'+joueurActif).classList.remove("disabled");

    var tds_plat = document.querySelectorAll('#plateau td');
    for(const element of tds_plat){
        if(element.style.backgroundImage != ""){
            element.style.opacity = '1';
            element.draggable = false;
        }
    }

    var tds = document.querySelectorAll('.j_pions td');
    for(const element of tds){
        element.style.opacity = '1';
        element.draggable = true;
    }

    // Mise à jour des points des joueurs 

    for(const j of tab_joueurs){
        document.getElementById("pts_j" + j.id).innerText = j.score.toString();
    }
    
}

// Fonctions de drag and drop des pions

// Executée quand on commence à drag un pion qu'on veut poser
function pion_drag(event) {
    event.dataTransfer.setData("application/qwirkle_drag_drop", event.target.id);
    event.dataTransfer.dropEffect = "move";
}

// Executée quand on dépose le pion dans une des cases du tableau
function pion_drop(event) {
    event.preventDefault();
    var id_pion = event.dataTransfer.getData("application/qwirkle_drag_drop");
    if((id_pion[0] == event.target.id[0] && event.target.style.backgroundImage != '') || event.target.style.backgroundImage != ''){
        return;
    }

    var vientDesPoches = id_pion.startsWith('j');
    var vientDeLaGrille = !vientDesPoches;
    var vaVersPoches = event.target.id.startsWith('j');
    var vaVersSac = event.target.id=='retour_sac';
    var vaVersGrille = !vaVersPoches && !vaVersSac;

    if(vientDeLaGrille && vaVersSac){
        notify("Replacez le pion dans votre jeu avant de le remettre dans le sac de pions.");
        return;
    }

    if((vaVersSac||suppresionPions) && Object.keys(statut_tour).length>0){
        var _s = '';
        if(Object.keys(statut_tour).length>1){
            _s = 's'
        }
        notify("Retirez le"+_s+" pion"+_s+" du plateau avant d'en remettre dans le sac de pions.");
        return;
    }

    if(suppresionPions && vaVersGrille){
        notify("Vous avez remis un pion dans le sac. Vous devez valider votre tour pour placer un pion");
        return;
    }

    if(!vaVersSac){
        event.target.style.backgroundImage = document.getElementById(id_pion).style.backgroundImage;
    }
    document.getElementById(id_pion).style.backgroundImage = '';
    document.getElementById(id_pion).style.opacity = '0.5';
    document.getElementById(id_pion).draggable = false;

    if(!event.target.id.includes('plateau')){
        event.target.style.opacity = '1';
    }
    event.target.draggable = true;
    
    // remise du pion dans le sac
    if(vientDesPoches && vaVersSac){
        h = id_pion.substring(1).split("_");
        var pion = tab_joueurs[parseInt(h[0])].pions[parseInt(h[1])];
        tab_joueurs[parseInt(h[0])].pions[parseInt(h[1])] = "";
        sac_pions.push(pion);
        melanger(sac_pions);
        suppresionPions = true;
    }

    // poche --> grille
    if(vientDesPoches && vaVersGrille){
        h = id_pion.substring(1).split("_");
        var joueur = h[0];
        var pion = tab_joueurs[parseInt(h[0])].pions[parseInt(h[1])];
        statut_tour[event.target.id] = pion;
        tab_joueurs[parseInt(h[0])].pions[parseInt(h[1])] = "";
    }
    
    // grille --> poche
    if(vientDeLaGrille && vaVersPoches){
        var p = statut_tour[id_pion];
        var h2 = event.target.id.substring(1).split("_");
        tab_joueurs[parseInt(h2[0])].pions[parseInt(h2[1])] = p;
        delete statut_tour[id_pion];
    }

    // grille --> grille
    if(vientDeLaGrille && vaVersGrille){
        statut_tour[event.target.id] = statut_tour[id_pion];
        delete statut_tour[id_pion];
    }

    // poche --> poche
    if(vientDesPoches && vaVersPoches){
        var h = id_pion.substring(1).split("_");
        var h2 = event.target.id.substring(1).split("_");
        tab_joueurs[parseInt(h[0])].pions[parseInt(h2[1])] = tab_joueurs[parseInt(h[0])].pions[parseInt(h[1])];
        tab_joueurs[parseInt(h[0])].pions[parseInt(h[1])] = "";
    }
    
}

// Executée à chaque mouvement de souris
function pion_dragover(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
}

// Création du plateau de jeu : Une <table> HTML contenant des <td> dont l'id indique les coordonnées "x_y" du <td>
function creer_plateau(taille_plateau){
    // Création de la grille de jeu 
    grille = '<table id="plateau">';

    for (const x of Array(taille_plateau).keys()) {
        grille += '<tr>';
        for (const y of Array(taille_plateau).keys()) {
            grille += '<td ondrop="pion_drop(event)" ondragover="pion_dragover(event)" ondragstart="pion_drag(event)" id="plateau_'+ x +'_'+ y +'"></td>';
        }
        grille += '</tr>';
    }
    grille += '</table>';

    // On ajoute le code HTML de la grille à la page web visible
    document.getElementById("GameTable").innerHTML = grille;
}

// Le joueur id pioche UN pion. Le pion est ajouté à la liste des pions du joueur id, et
// est retiré du sac de pions.
function piocher_pion(id){
    var joueur = tab_joueurs[id];
    if(sac_pions.length>0){
        joueur.pions.push(sac_pions.pop());
    }
}

function generer_ui_joueurs(nb_joueurs,newPartie=true) {
    // On affiche le nom des joueurs
    var EmplacementJoueurs_code = '';
    for(k=0; k<nb_joueurs; k++){
        var nom_joueur;
        if(newPartie){
            // TODO : Ajouter le support des noms
            nom_joueur = $('#j'+k+'_name').val();
            $('#j'+k+'_name').val('');

            // On crée le joueur et on l'ajoute à la liste des joueurs
            var joueur = new Joueur(nom_joueur,k);
            tab_joueurs.push(joueur);

            // On procède à la distribution initiale des pions aux joueurs
            for(p=0; p<pions_par_joueur; p++){
                piocher_pion(k);
            }
        } else {
            nom_joueur = tab_joueurs[k].nom;
        }

        // On construit le dashboard de chaque joueur
        EmplacementJoueurs_code += '<h3>'+ nom_joueur + ' ~ Points: <span id="pts_j' + k + '">0</span></h3><div id="piecesJoueurs' + k + '"><table class="j_pions">';
        for(td = 0; td <pions_par_joueur; td++){
            EmplacementJoueurs_code += '<td draggable="true" ondrop="pion_drop(event)" ondragover="pion_dragover(event)" ondragstart="pion_drag(event)" id=j'+ k + '_' + td +'></td>';
        }
        EmplacementJoueurs_code += '</table></div>';
    }
    EmplacementJoueurs_code += '<div id="tour_actions"><img id="retour_sac" ondrop="pion_drop(event)" ondragover="pion_dragover(event)" src="images/bag.png"><p class="Bouton" id="bouton"><input type="submit" name="valider_tour" id="valider_tour" value="Valider le tour" onclick="valider_tour();"/></p></div>';

    // On ajoute les dashboards des joueurs à la page web visible
    document.getElementById("EmplacementJoueurs").innerHTML = EmplacementJoueurs_code;
}

// Clique sur le bouton lancer partie
function creer_partie(){
    // On récupere le nombre de joueurs qui vont jouer
    var nb_joueurs = document.querySelector('input[type="radio"]:checked').value;

    for(k=0; k<nb_joueurs; k++){
        if($('#j'+k+'_name').val()==''){
            notify('Entrez un nom pour chaque joueur');
            return;
        }
    }

    partie_id = makeid(9);

    statut_tour = {};
    plateau_jeu = {};
    joueurActif = 0;
    partieCommencee = false;

    // Nouvelle partie -> On vide et remet tous les pions dans le sac
    remplir_sac_pions();

    // On remet à zero la liste des joueurs
    tab_joueurs = [];    

    generer_ui_joueurs(nb_joueurs);

    // On met à jour l'interface du jeu en conséquence.
    interface_graphique();
};

// Fonction qui permet de vérifier si il n'y a pas 2x la même pièce 
function pieceUnique(listePion){

    var _string = [];
    for(const p of listePion){
        var s = p.toString();
        if(_string.includes(s)){
            return false;
        }else{
            _string.push(s);
        }
    }
    return true;

}
// Fonction qui regarde si les pions de la liste ont la même forme ou la même couleur
function pointCommun(listePion){
    var tableauCouleur = [];
    var tableauForme = [];

    for(const p of listePion){

        if(!tableauCouleur.includes(p.couleur)){
            tableauCouleur.push(p.couleur);
        }

        if(!tableauForme.includes(p.forme)){
            tableauForme.push(p.forme);
        }
    }

    if(Math.min(tableauCouleur.length, tableauForme.length)>1){
        return false;
    }
    return true;
}

function qwirkle_shake(){
    var lm = document.getElementById("qwirkle_logo");
    lm.classList.add("spin");

    setTimeout(function(){
        lm.classList.remove("spin");
    },1200);

}

function mix_plateauTour_StatutTour(_l, _c, _estEnLigne){
    // Lignes 
    var tabLigne = [statut_tour[ "plateau_" +_l + "_" + _c]];

    // Les pions à gauche du pion de ref 
    for(var c = _c - 1;c>=0; c-- ){
        var piPlateau = plateau_jeu[_l + "_" + c];
        var piStatut = statut_tour["plateau_" + _l+ "_" + c];
        if(piPlateau){
            tabLigne.push(piPlateau);
        }else{
            if(piStatut){
                tabLigne.push(piStatut);
            }else{
                break;
            }
        }
    }

    // Les pions à droite du pion de ref 
    for(var c = _c + 1;c<=_size; c++ ){
        var piPlateau = plateau_jeu[_l + "_" + c];
        var piStatut = statut_tour["plateau_" + _l+ "_" + c];
        if(piPlateau){
            tabLigne.push(piPlateau);
        }else{
            if(piStatut){
                tabLigne.push(piStatut);
            }else{
                break;
            }
        }
    }


    // On vérifie si il n'y a pas 2x la même pièce 
    if(!pieceUnique(tabLigne)){
        return false;
    }

    // On vérifie si il y a les bonnes formes et couleur sur ligne
    if(!pointCommun(tabLigne)){
        return false;
    }

    // Colonne 
    var tabColonne = [statut_tour["plateau_" + _l + "_" + _c]];
    // Les pions en haut du pion de ref 
    for(var l = _l - 1;l>=0; l-- ){
        var piPlateau = plateau_jeu[l + "_" + _c];
        var piStatut = statut_tour["plateau_" + l+ "_" + _c];
        if(piPlateau){
            tabColonne.push(piPlateau);
        }else{
            if(piStatut){
                tabColonne.push(piStatut);
            }else{
                break;
            }
        }
    }

    // Les pions à droite du pion de ref 
    for(var l = _l + 1;l<=_size; l++ ){
        var piPlateau = plateau_jeu[l + "_" + _c];
        var piStatut = statut_tour["plateau_" + l+ "_" + _c];
        if(piPlateau){
            tabColonne.push(piPlateau);
        }else{
            if(piStatut){
                tabColonne.push(piStatut);
            }else{
                break;
            }
        }
    }

    // On vérifie si il n'y a pas 2x la même pièce 
    if(!pieceUnique(tabColonne)){
        return false;
    }

    // On vérifie si il y a les bonnes formes et couleur sur colonne
    if(!pointCommun(tabColonne)){
        return false;
    }

    // Mise à jour des points
    if(_estEnLigne){
        if(scoreTour == 0 && (tabLigne.length != 1 || !partieCommencee)){
            if(tabLigne.length == 6){
                scoreTour += 12;
                qwirkle_shake();
            }else{
                scoreTour += tabLigne.length;
            }
        }
        if(tabColonne.length>1){
            if(tabColonne.length == 6){
                scoreTour += 12;
                qwirkle_shake();
            }else{
                scoreTour += tabColonne.length;
            }
            
        }
        
    }else{
        if(scoreTour == 0){
            if(tabColonne.length == 6){
                scoreTour += 12;
                qwirkle_shake();
            }else{
                scoreTour += tabColonne.length;
            }
        }
        if(tabLigne.length>1){
            if(tabLigne.length == 6){
                scoreTour += 12;
                qwirkle_shake();
            }else{
                scoreTour += tabLigne.length;
            }
        }
    }
        
    

    return true;
}

function tour_correct(){

    if(suppresionPions){
        return true;
    }

    var keys = Object.keys(statut_tour);

    // Tour non joué non autorisé
    if(keys.length==0){
        return false;
    }

    // On force les pions à être sur la même ligne ou sur la même colonne 

    var tableauLigne = [];
    var tableauColonne = [];

    for(const key of keys){
        var coord = key.split("_");
        var _ligne = parseInt(coord[1]);
        var _colonne = parseInt(coord[2]);

        if(!tableauLigne.includes(_ligne)){
            tableauLigne.push(_ligne);
        }

        if(!tableauColonne.includes(_colonne)){
            tableauColonne.push(_colonne);
        }
    }

    if(Math.min(tableauLigne.length, tableauColonne.length)>1){
        return false;
    }

    var estEnLigne = false;

    if(tableauLigne.length == 1){
        tableauColonne = tableauColonne.sort((a,b)=>a-b);
        estEnLigne = true;
        for(var i = 0; i< tableauColonne.length - 1 ;i++ ){
             if(tableauColonne[i+1] - tableauColonne[i] != 1){
                 return false; 
             } 
        }
    }

    if(tableauColonne.length == 1){
        tableauLigne = tableauLigne.sort((a,b)=>a-b);
        for(var i = 0; i< tableauLigne.length - 1 ;i++ ){
             if(tableauLigne[i+1] - tableauLigne[i] != 1){
                 return false; 
             } 
        }
    }

    // On éviter les pièces pareil sur chaque ligne et chaque colonne
    for(const key of keys){

        var coord = key.split("_");
        if(!mix_plateauTour_StatutTour(parseInt(coord[1]),parseInt(coord[2]),estEnLigne)){
            return false;
        }
    }

    // On vérifie que on a un voisin 
    for(const key of keys){
        var coord = key.split("_");
        var h = plateau_jeu[(parseInt(coord[1])-1)+"_"+parseInt(coord[2])];
        var b = plateau_jeu[(parseInt(coord[1])+1)+"_"+parseInt(coord[2])];
        var g = plateau_jeu[parseInt(coord[1])+"_"+(parseInt(coord[2])-1)];
        var d = plateau_jeu[parseInt(coord[1])+"_"+(parseInt(coord[2])+1)];

        
        var h2 = statut_tour["plateau_" + (parseInt(coord[1])-1)+"_"+parseInt(coord[2])];
        var b2 = statut_tour["plateau_" + (parseInt(coord[1])+1)+"_"+parseInt(coord[2])];
        var g2 = statut_tour["plateau_" + parseInt(coord[1])+"_"+(parseInt(coord[2])-1)];
        var d2 = statut_tour["plateau_" + parseInt(coord[1])+"_"+(parseInt(coord[2])+1)];

        if(!h&&!b&&!g&&!d&&!h2&&!b2&&!g2&&!d2&&partieCommencee){
            return false;
        }
    }
    partieCommencee = true;
    return true;
}


// Valider le tour
function valider_tour(){
    if(tour_correct()){

        // On met à jour le plateau du jeu en y entrant les pions posés 
        for(const key of Object.keys(statut_tour)){
            var pi = statut_tour[key];
            var id = key.split("_")[1] +"_"+key.split("_")[2];
            plateau_jeu[id] = pi;
        }

        var nb_pion_utilise = 0;
        // On remet des pions dans les poches 
        for(const pion_of_tab_joueur of tab_joueurs[joueurActif].pions){
            if(pion_of_tab_joueur == ""){
                nb_pion_utilise++;
            }
        }

        tab_joueurs[joueurActif].pions = tab_joueurs[joueurActif].pions.filter(function(f) { return f != "" });

        for(i=0; i<nb_pion_utilise ; i++){
            piocher_pion(joueurActif);
        }

        // Maj Score
        tab_joueurs[joueurActif].score += scoreTour;
        scoreTour = 0;

        statut_tour = {};
        joueurActif++;
        joueurActif = joueurActif%tab_joueurs.length;

        suppresionPions = false;

        // On met à jour l'interface du jeu en conséquence.
        interface_graphique();

        // Cas : partie terminée
        var _partieterminee = false;
        for(const _j of tab_joueurs) {
            if(_j.pions.length==0) {
                _partieterminee = true;
                _j.score+=6;
                break;
            }
        }
        if(_partieterminee){
            for(const _j of tab_joueurs) {
                _j.score-=_j.pions.length;
            }

            tab_joueurs.sort((a,b)=>b.score-a.score);
            var _html = '<h2>'+tab_joueurs[0].nom+' a gagné</h2>';
            var _place = '<p>2ème: ';
            for(var i=1;i<tab_joueurs.length;i++){
                _html+= (_place + tab_joueurs[i].nom+' (avec un score de '+tab_joueurs[i].score+')</p>');
                if(i==1){
                    _place = '<p>3ème: ';
                }
                if(i==2){
                    _place = '<p>4ème: ';
                }
            }
            notify(_html);
        }

        // TODO : sauvegarder l'état de la partie dans l'API
        sauvegarder();

    }else{
        scoreTour = 0;
        notify("Le tour n'est pas valide !");
    }


}

/* ------------------------------------ */
/*       VARIABLES GLOBALES DU JEU      */
/* ------------------------------------ */

// Types de pièces disponibles
formes = ['Carre', 'Rond', 'Triangle', 'Croix', 'Etoile', 'Trefle'];
couleurs = ['Rouge', 'Vert', 'Bleu', 'Orange', 'Jaune', 'Violet'];

// Liste des joueurs de la partie
tab_joueurs = [];

// Sac contenant tous les pions du jeu
sac_pions = [];

// Plateau de jeu sous la forme d'un dict
// key : x_y <string> (Coordonnées sur le plateau)
// value : <Pion> (Pion déposé sur le plateau) 
var plateau_jeu = {};

// Statut du tour en cours
// contient les pions à poser
var statut_tour = {};

// Score du tour
var scoreTour = 0;
// Flag activé si le joueur remet des pions dans le sac
var suppresionPions = false;

// Détermine le joueur qui doit jouer
var joueurActif = 0;

// Détermine si la partie a fait au moins 1 tour
var partieCommencee = false;

var partie_id = '';

// Au Qwirkle, il y a 6 pions par joueur
var pions_par_joueur = 6;


/* ------------------------------------ */
/*         INITIALISATION DU JEU        */
/* ------------------------------------ */

// On crée le plateau de jeu
// Argument : La taille de la zone de jeu

var _size = 17;
creer_plateau(_size);

function inject_parties_liste(){
    $('.parties_liste_id').click(async function(){
        $('#notification').fadeOut(300);
        var _id = $(this).text();
        var res = await charger_partie(_id);
        setTimeout(function(){
            notify("Partie "+_id+" chargée avec succès ✅");
        },300);
    });
    $('#parties_liste_abort').click(function(){
        $('#notification').fadeOut(300);
    });
}

// Code executé une fois que la page est entièrement chargée
$(document).ready(function(){
    $('input[type="radio"]').change(function(){
        var _nb_joueurs = parseInt($('input[type="radio"]:checked').val());
        var _html = '';
        for(var i=0;i<_nb_joueurs;i++){
            _html += '<label for="j'+i+'_name">Nom du joueur '+(i+1)+'</label>';
            _html += '<input type="text" name="j'+i+'_name" id="j'+i+'_name" placeholder="Côme">';
        }
        $('#noms_joueurs_inputs').html(_html);
    });

    $('#save_game').click(async function(){
        var res = await sauvegarder();
        notify("Partie "+partie_id+" sauvegardée ✅",6);
    });

    $('#load_game').click(function(){
        touteslesparties();
    });

    $('input[type="radio"]').trigger('change');
})
