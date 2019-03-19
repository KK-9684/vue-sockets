<template>
  <div class="font-source-sans font-normal leading-normal">

    <header class="bg-blue-darkest text-white">
      <div class="container mx-auto px-4 py-6">
        <h1>Quote Racer</h1>
        <h2>Type quotes from interesting people before your friends do.</h2>

        <div class="flex justify-end my-4">
          <slot name="app-buttons"></slot>
        </div>

        <div class="my-6">
          <slot name="quote"></slot>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4">
      <slot name="player-form"></slot>

      <slot name="players-list"></slot>

      <slot name="characters"></slot>
    </div>

  </div>
</template>
