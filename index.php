<?php
// contact.php - Traitement des formulaires

// Traitement du formulaire de contact
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['contact_submit'])) {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $subject = htmlspecialchars($_POST['subject']);
    $message = htmlspecialchars($_POST['message']);
    
    $to = "patientkiwala@gmail.com";
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    $email_body = "
    <html>
    <head>
        <title>Nouveau message de contact ASHILAC</title>
    </head>
    <body>
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Sujet:</strong> $subject</p>
        <p><strong>Message:</strong></p>
        <p>$message</p>
    </body>
    </html>
    ";
    
    if (mail($to, $subject, $email_body, $headers)) {
        echo json_encode(["status" => "success", "message" => "Votre message a été envoyé avec succès!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Une erreur s'est produite lors de l'envoi du message."]);
    }
    exit;
}

// Traitement de l'inscription à la newsletter
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['newsletter_submit'])) {
    $newsletter_email = htmlspecialchars($_POST['newsletter_email']);
    
    // Enregistrement dans un fichier (dans un cas réel, vous utiliseriez une base de données)
    $file = 'newsletter_subscribers.txt';
    $current = file_get_contents($file);
    $current .= "$newsletter_email\n";
    if (file_put_contents($file, $current)) {
        echo json_encode(["status" => "success", "message" => "Merci pour votre inscription à notre newsletter!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Une erreur s'est produite lors de l'inscription."]);
    }
    exit;
}

// Si aucune action n'est spécifiée, rediriger vers l'accueil
header("Location: index.html");
exit;
?>