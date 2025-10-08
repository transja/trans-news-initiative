<script>
	let { size = 16 } = $props();
	const colors = ["#7CDEE0", "#E5BDF5"];
</script>

<span
	class="loader"
	style="--size: {size}px; --color1: {colors[0]}; --color2: {colors[1]}"
></span>

<style lang="scss">
.loader {
    animation: rotate 1s infinite;
    height: var(--size);
    width: var(--size);
  }

  .loader:before,
  .loader:after {
    border-radius: 50%;
    content: "";
    display: block;
    height: calc(var(--size) * 0.4);
    width: calc(var(--size) * 0.4);
  }
  .loader:before {
    animation: ball1 1s infinite;
    background-color: var(--color1);
    box-shadow: calc(var(--size) * 0.6) 0 0 var(--color2);
    margin-bottom: calc(var(--size) * 0.2);
  }
  .loader:after {
    animation: ball2 1s infinite;
    background-color: var(--color2);
    box-shadow: calc(var(--size) * 0.6) 0 0 var(--color1);
  }

  @keyframes rotate {
    0% { transform: rotate(0deg) scale(0.8) }
    50% { transform: rotate(360deg) scale(1.2) }
    100% { transform: rotate(720deg) scale(0.8) }
  }

  @keyframes ball1 {
    0% {
      box-shadow: calc(var(--size) * 0.6) 0 0 var(--color2);
    }
    50% {
      box-shadow: 0 0 0 var(--color2);
      margin-bottom: 0;
      transform: translate(calc(var(--size) * 0.3), calc(var(--size) * 0.3));
    }
    100% {
      box-shadow: calc(var(--size) * 0.6) 0 0 var(--color2);
      margin-bottom: calc(var(--size) * 0.2);
    }
  }

  @keyframes ball2 {
    0% {
      box-shadow: calc(var(--size) * 0.6) 0 0 var(--color1);
    }
    50% {
      box-shadow: 0 0 0 var(--color1);
      margin-top: calc(var(--size) * -0.4);
      transform: translate(calc(var(--size) * 0.3), calc(var(--size) * 0.3));
    }
    100% {
      box-shadow: calc(var(--size) * 0.6) 0 0 var(--color1);
      margin-top: 0;
    }
  }
  
</style>
