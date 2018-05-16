<?php
$name = $_POST['name']; 
$email = $_POST['email']; 
$message = $_POST['message']; 
$order = $_POST['order'];

$to = "eric_mcallister@outlook.com";
$subject = "ORDER";
$txt = "Name:" . $name . "\n\rEmail:" . $email . " \n\rCustom Message:" . $message . "\n\rProducts:" . $order;
$headers = "From: bot@ericinbrackets.co";
mail($to,$subject,$txt,$headers);

$subject = "Order Confirmation";
$txt = "Your order has been received and we should be contacting you shortly.";
mail($email,$subject,$txt,$headers);
?>