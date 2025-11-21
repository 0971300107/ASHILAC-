<?php
// newsletter.php - Traitement spécifique de la newsletter
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['newsletter_email'])) {
    $newsletter_email = htmlspecialchars($_POST['newsletter_email']);
    
    // Enregistrement dans un fichier
    $file = 'newsletter_subscribers.txt';
    $current = file_get_contents($file);
    $current .= date('Y-m-d H:i:s') . " - $newsletter_email\n";
    
    if (file_put_contents($file, $current)) {
        echo "Merci pour votre inscription à notre newsletter!";
    } else {
        echo "Une erreur s'est produite lors de l'inscription.";
    }
} else {
    header("Location: index.html");
}
?>