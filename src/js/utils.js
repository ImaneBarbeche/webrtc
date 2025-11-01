/**
 **************************************************************************************
 * utils.js regroupe toutes les fonctions utilitaires possible (popups, alertes,etc.) *
 *                                                                                    *
 **************************************************************************************
 */

function prettyPrompt(item, attributes, callback) {
  
 
    // Générer des inputs HTML en fonction des attributs
    let inputFields = attributes.map(attr => {
      console.log(item)
      const fieldId = attr.replace(/\s+/g, '_').toLowerCase();
      //const defaultValue =  (typeof item.attributes[attr] === "object" ? item.attributes[attr].name : item.attributes[attr]) || '';  // Utilise la valeur existante ou une chaîne vide si elle n'existe pas
      
      return `
        <label for="${fieldId}">${attr}:</label>
        <input type="text" id="${fieldId}" class="swal2-input" value="${item.attributes ? item.attributes[attr] : ''}"><br/>
      `;
  }).join('');

    // Utiliser SweetAlert 2 avec Swal.fire()
    Swal.fire({
      title: item.title,
      html: inputFields,  // Place les inputs générés ici
      showCancelButton: true,
      focusConfirm: false,
      preConfirm: () => {
        // Récupérer les valeurs de chaque input
        let formData = {};
        attributes.forEach(attr => {
          let fieldId = attr.replace(/\s+/g, '_').toLowerCase();
          let value = document.getElementById(fieldId).value;
          formData[attr] = value.trim() === '' ? 'Non renseigné' : value;
        });
        return formData;
      }
    }).then(result => {
      if (result.isConfirmed) {
        callback(result.value);  // Retourner les données via le callback
      } else {
        callback(null);  // Annuler si l'utilisateur clique sur "Annuler"
      }
    });
}

function prettyEpisode(content, callback) {
  Swal.fire({
    title: "Ajout d'un épisode",
    input: 'text',  // Utiliser un champ texte pour le nom de l'épisode
    inputLabel: 'Nom de l\'épisode',
    inputValue: content || '',  // Préremplir le champ texte avec `content` s'il existe
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Annuler',
    preConfirm: (value) => {
      if (!value) {
        Swal.showValidationMessage('Le champ ne peut pas être vide');
        return false;
      }
      return value;  // Retourner la valeur du champ texte si valide
    }
  }).then(result => {
    if (result.isConfirmed) {
      callback(result.value);  // Utiliser la valeur entrée
    } else {
      callback(null);  // Annuler si l'utilisateur a cliqué sur "Annuler"
    }
  });
}


function prettyConfirm(title, text) {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    cancelButtonColor: "#d33",
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    return result.isConfirmed; // Retourne true si le bouton confirmer est cliqué
  });
}

function getAttributes(event){
  
    switch (event) {
      case "Premier logement": //res
        return ["Localisation","Type","Surface","Commentaire(s)"];
      case "Déménagement": //res
        return ["Localisation","Société de démenagement","Commentaire(s)"];
      case "Etude": //pro
        return ["Localisation","Commentaire(s)"]; 
      case "Premier emploi": //pro
        return ["Localisation", "Poste","Commentaire(s)"];
      case "Changement d'emploi": //pro
        return ["Localisation", "Poste","Commentaire(s)"];
      case "Naissance ego": //fam
        return ["Localisation"];
      case "Divorce": //fam
        return ["Commentaire(s)"];
      case "Mariage": //fam
        return ["Commentaire(s)"];
        case "Naissance": //fam
        return ["Commentaire(s)"];
        case "Décès": //fam
        return ["Commentaire(s)"];
        case "Union": //fam
        return ["Commentaire(s)"];
      default:
        return "erreur";
  }
}

/**
 * Affiche un toast de notification
 * @param {string} title - Titre de l'alerte
 * @param {string} text - Texte de l'alerte
 * @param {string} icon - Type d'icône (success, error, warning, info)
 * @param {number} timer - Durée d'affichage en ms (optionnel)
 */
function prettyAlert(title, text, icon = 'info', timer = 2000) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  Toast.fire({
    icon: icon,
    title: title,
    text: text
  });
}

  

export { prettyPrompt, prettyEpisode, prettyConfirm, getAttributes, prettyAlert }