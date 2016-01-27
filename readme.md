
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

 - Fix facebook disconnect issue
 - Add Windows audio support


## Install ##

**You need a Spotify Premium account and a Facebook App for use it.**

1) Generate Application Key

First of all, please generate a application key on the spotify developper platform.
https://devaccount.spotify.com/my-account/keys/

2) Paste Application Key

Then, paste the binary key at the project's root and name it :

    spotify_appkey.key


3) Install Backend Dependencies

```sh
npm install
```

4) Install Frontend Dependencies

```sh
cd public
bower install
```

## Configure ##


1) In /app.js

Replace *YOUR_SPOTIFY_LOGIN* and *YOUR_SPOTIFY_PASSWORD* by your Spotify credentials.

2) In public/app.js

Replace *YOUR_FB_APP_ID* by your facebook application ID.


## Launch ##

At the project's root :
```sh
node app.js
```

Access to http://localhost:8080 and enjoy !
