<template>
  <button
    class="bg-blue hover:bg-blue-dark text-white font-semibold hover:text-white py-2 px-4 border border-blue hover:border-transparent rounded"
    title="title"
    :class="{ 'opacity-50': disabled }"
    :disabled="disabled"
    @click="$emit('button-click')"
  >
    <slot></slot>
  </button>
</template>
<script>
  export default {
    name: 'Button',
    props: {
      buttonTitle: String,
      disabled: Boolean,
    },
  };
</script>
