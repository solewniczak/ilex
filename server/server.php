#!/usr/bin/env php
<?php

require_once('PHP-Websockets/websockets.php');

class echoServer extends WebSocketServer {
  //protected $maxBufferSize = 1048576; //1MB... overkill for an echo server,
  //but potentially plausible for other applications.

  protected function process ($user, $message) {
    $json = json_decode($message);
    $text = dirname(__FILE__).'/texts/'.$json->{'text'}.'.txt';
    if (file_exists($text)) {
      $contet = file_get_contents($text);
      $value = json_encode(array(
                            'target' => $json->{'target'},
                            'text' => $contet,
                            //test links hard coded
                            'links' => array(
                              array("1+10", "100+200"),
                              array("1+10", "500+100"),
                              array("200+20", "310+10")
                            )
                          )
                        );
    } else {
      $value = "error: $text not found";
    }
    $this->send($user,$value);
  }

  protected function connected ($user) {
    // Do nothing: This is just an echo server, there's no need to track the user.
    // However, if we did care about the users, we would probably have a cookie to
    // parse at this step, would be looking them up in permanent storage, etc.
  }

  protected function closed ($user) {
    // Do nothing: This is where cleanup would go, in case the user had any sort of
    // open files or other objects associated with them.  This runs after the socket
    // has been closed, so there is no need to clean up the socket itself here.
  }
}

$echo = new echoServer("0.0.0.0","9000");

try {
  $echo->run();
}
catch (Exception $e) {
  $echo->stdout($e->getMessage());
}
