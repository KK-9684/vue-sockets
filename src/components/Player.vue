<template>
  <div class="">
    <div class="">
      <h4>{{ name }}</h4>
      <div class="">
        <button
          class=""
          :class="{ hollow: isOwned }"
          @click="$emit('own-player', name)"
        >
          {{ isOwned ? 'You are this player' : 'Be this player' }}
        </button>
      </div>

      <div class="">
        <div class="">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Player',
  props: {
    isOwned: Boolean,
    isActive: Boolean,
    name: String,
  },
};
</script>
