
Spotify Social Playlist
=======

*Please note that this application is still under development and for now, only works on OSX and Linux*

This is a small application that allows you and your friends to vote for the music to be broadcast on your speakers.

![Search tracks](http://files.clement.io/img/sp/search.png)
![Track list](http://files.clement.io/img/sp/home.png)

Features
-------

 - Facebook connect
 - Choose tracks
 - Delete your own tracks
 - Like and dislike tracks
 - Auto deleting too disliked tracks (optional)

To Do
-------

 - Add Windows audio support


## Install ##

**You need a Spotify Premium account and a Facebook App for use it.**

1) Generate Application Key

First of all, please generate a application key on the spotify developper platform.
https://devaccount.spotify.com/my-account/keys/

2) Paste Application Key

Then, paste the binary key at the project's root and name it :

    spotify_appkey.key


3) Install Dependencies

```sh
gulp install
```

## Configure ##


1) In **/config/development.json**

Replace **YOUR_SPOTIFY_LOGIN** and **YOUR_SPOTIFY_PASSWORD** by your Spotify credentials.

2) In **/front/src/js/app.js**

Replace **YOUR_FB_APP_ID** by your facebook application ID.

3) Custom config

You can edit the server URL in **/front/src/js/environments/current.js**
You can also edit the autodestroy options and the server parameters in **/config/development.json**


## Launch ##

Compile assets and launch project :
```sh
gulp
```

Access to http://127.0.0.1:8000 and enjoy !
