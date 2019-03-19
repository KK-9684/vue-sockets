<template>
  <Page>

    <template v-slot:app-buttons>

      <Button :disabled="!draftAvailable" @button-click="resetBoard">
        New Round
      </Button>

      <Button :disabled="!draftAvailable || roomState.draftStarted" @button-click="startDraft">
        Start Round
      </Button>

    </template>

    <template v-slot:quote>
      <p>Room: {{ $route.params.room }}</p>
      <div class="text-5xl italic p-4">{{ quote }}</div>
    </template>


    <template v-slot:player-form>
      <form @submit.prevent="addPlayer" class="w-full max-w-sm">
        <div class="flex items-center border-b border-b-2 border-teal py-2">
          <input
            class="appearance-none bg-transparent border-none w-full text-grey-darker mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Add a new player"
            v-model="playerName"
            :disabled="inputDisabled"
          />
          <button class="flex-no-shrink bg-blue hover:bg-blue-dark border-blue hover:border-blue-dark text-sm border-4 text-white py-1 px-2 rounded">
            Add Player
          </button>
        </div>
      </form>
    </template>

    <template v-slot:players-list>
      <div
        class=""
        v-for="player in roomState.players"
        :key="player.name"
        @click="activePlayer = player.name"
      >
        <Player
          :is-owned="ownedPlayer === player.name"
          :is-active="roomState.activePlayer === player.name"
          :name="player.name"
          @own-player="ownPlayer"
        />
      </div>
    </template>

    <template v-slot:characters>
    </template>
  </Page>
</template>

<script>
import set from 'lodash/set';
import { uniqueNamesGenerator } from 'unique-names-generator/dist/index';

import Button from './Button';
import Page from './Page';
import Player from './Player';

export default {
  name: 'Board',
  methods: {
    addPlayer() {
      // Tell everyone
      this.emitSocket('PLAYER_ADD', this.playerName);

      // Retrieve localstorage
      const history = JSON.parse(localStorage.getItem('smashcrowd')) || {};
      // Update player name for this room
      set(history, `${this.room}.playerName`, this.playerName);
      // Set player name for this room in localstorage
      localStorage.setItem('smashcrowd', JSON.stringify(history));
    },
    addCharToPlayer(charName) {
      this.emitSocket('PLAYER_ADD_CHARACTER', {
        charName,
        playerName: this.playerName,
      });
    },
    startDraft() {
      this.emitSocket('DRAFT_START');
    },
    ownPlayer(name) {
      this.playerName = name;
    },
    resetBoard() {
      this.emitSocket('ROOM_RESET');
    },
    emitSocket(event, payload) {
      this.$socket.emit(event, {
        room: this.room,
        payload,
      });
    },
  },
  mounted() {
    // Forward to named room
    if (!this.$route.params.room) {
      this.$router.push(uniqueNamesGenerator('-'));
    }

    // Pull player name for this room from localstorage
    const history = JSON.parse(localStorage.getItem('smashcrowd'));
    // Restore player name for this room
    if (history && history[this.room]) {
      this.playerName = history[this.room].playerName;
    }
  },
  computed: {
    room() {
      return this.$route.params.room;
    },
    draftAvailable() {
      return !!this.roomState.players.length;
    },
    // Player has already chosen name
    inputDisabled() {
      return !!this.roomState.players.find(
        ({ name }) => name === this.playerName
      );
    },
    ownedPlayer() {
      const player = this.roomState.players.find(
        ({ name }) => name === this.playerName
      );

      return player ? player.name : '';
    },
    isActivePlayer() {
      return this.playerName === this.roomState.activePlayer;
    },
  },
  data() {
    return {
      playerName: '',
      quote: 'This is a long quote.',
      roomState: {
        players: [],
        characters: [],
        activePlayer: '',
        draftStarted: false,
      },
    };
  },
  components: {
    Button,
    Page,
    Player,
  },
  sockets: {
    connect() {
      this.emitSocket('ROOM_JOIN', this.room);
    },
    ROOM_STATE(roomState) {
      this.roomState = roomState;
    },
  },
};
</script>
