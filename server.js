/* eslint-disable no-console */
const path = require('path');
const _ = require('lodash');

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const history = require('connect-history-api-fallback');

const db = require('monk')('localhost:27017/smash');

const app = express();
const server = http.Server(app);
const io = socketio(server);

const characters = require('./lib/chars').chars;

const PORT = 3000;

// Express serving static, built version of Vue app
const staticMiddleware = express.static(path.join(__dirname, 'dist'));
app.use(staticMiddleware);
app.use(history());
app.use(staticMiddleware);
// `app.use(staticMiddleware)` is included twice per:
// https://github.com/bripkens/connect-history-api-fallback/blob/master/examples/static-files-and-index-rewrite/README.md#configuring-the-middleware

server.listen(PORT, function() {
  console.log(`Listening on *:${PORT}`);
});

db.then(() => {
  console.log('MongoDB connected.');
});

const state = {};
const rooms = db.get('rooms');

// Socket stuff
io.sockets.on('connection', socket => {
  console.log('User has connected');

  /**
   * Unique urls are "rooms" on our state
   */
  socket.on('ROOM_JOIN', async ({ room }) => {
    // Create room if joining first time
    const roomState = await rooms.findOneAndUpdate(
      { room },
      {
        $setOnInsert: {
          room,
          activePlayer: '',
          draftStarted: false,
          players: [],
          characters,
        },
      },
      { upsert: true }
    );
    // Emit to *just this new user* the new room state
    socket.join(room).emit('ROOM_STATE', roomState);
  });
  /**
   * Add player and inform everyone
   */
  socket.on('PLAYER_ADD', async ({ room, payload: playerName }) => {
    const roomState = await rooms.findOneAndUpdate(
      { room },
      {
        // Add player with starting shape
        $push: {
          players: {
            name: playerName,
            characters: [],
          },
        },
        // Also set active
        $set: { activePlayer: playerName },
      }
    );

    io.sockets.in(room).emit('ROOM_STATE', roomState);
  });
  /**
   * Shuffle players and inform everyone
   */
  socket.on('PLAYERS_SHUFFLE', async ({ room }) => {
    const { players } = await rooms.findOne(
      { room },
      { players: 1 }
    );

    // fix this
    const roomState = await rooms.findOneAndUpdate(
      { room },
      {
        $set: {
          players: _.shuffle(players),
        }
      }
    );

    io.sockets.in(room).emit('ROOM_STATE', roomState);
  });
  /**
   * Wipe all players
   */
  socket.on('ROOM_RESET', async ({ room }) => {
    const roomState = await rooms.findOneAndUpdate(
      { room },
      {
        $set: {
          players: [],
          draftStarted: false,
          characters,
        }
      }
    );

    io.sockets.in(room).emit('ROOM_STATE', roomState);
  });
  /**
   * Start draft
   */
  socket.on('DRAFT_START', async ({ room }) => {
    const { players } = await rooms.findOne(
      { room },
      'players'
    );

    const roomState = await rooms.findOneAndUpdate(
      { room },
      {
        $set: {
          draftStarted: true,
          activePlayer: players[0].name,
        },
      }
    );

    io.sockets.in(room).emit('ROOM_STATE', roomState);
  });
  /**
   *
   * Add char to player
   */
  socket.on('PLAYER_ADD_CHARACTER', async ({ room, payload }) => {
    const { charName, playerName } = payload;
    const roomData = await rooms.findOne({ room });

    const characters = roomData.characters;

    // Find char
    const char = characters.find(({ name }) => name === charName);
    // Add char to player
    roomData.players
      .find(({ name }) => name === playerName)
      .characters.push(char);
    // Overwrite characters, removing selected char
    roomData.characters = characters.filter(({ name }) => name !== charName);

    // Set next active player
    const playerIndex = roomData.players.findIndex(
      ({ name }) => name === roomData.activePlayer
    );
    // If last in array
    roomData.activePlayer =
      playerIndex === roomData.players.length - 1
        ? // then jump to first player
        roomData.players[0].name
        : // otherwise next index in array
        roomData.players[playerIndex + 1].name;

    // Update db and return new value
    const roomState = await rooms.findOneAndUpdate(
      { room },
      roomData
    );

    io.sockets.in(room).emit('ROOM_STATE', roomState);
  });
});
