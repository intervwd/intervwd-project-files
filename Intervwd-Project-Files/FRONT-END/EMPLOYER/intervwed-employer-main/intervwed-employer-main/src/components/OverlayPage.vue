<template>
  <v-overlay
    :model-value="overlay"
    class="align-center justify-center"
    persistent
    scrim="rgba(0, 0, 0, 0.5)"
  >
    <div class="floating-loader">
      <div class="loader-container">
        <div class="orbital-ring">
          <div class="orbital-dot"></div>
          <div class="orbital-dot"></div>
          <div class="orbital-dot"></div>
        </div>
        <div class="center-glow"></div>
      </div>

      <div class="floating-particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>

      <!-- <div class="loading-text mt-6">Loading... Please wait</div> -->
    </div>
  </v-overlay>
</template>

<script>
export default {
  props: {
    overlay: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style scoped>
.floating-loader {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  padding: 32px 40px;
  border-radius: 24px;
  min-width: 250px;
  overflow: hidden;
  animation: fadeIn 0.6s ease-in-out;
}

.loader-container {
  position: relative;
  width: 60px;
  height: 60px;
}

.orbital-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #42abe4, #42abe4, #42abe4, #42abe4);
  animation: rotate 3s linear infinite;
}

.orbital-ring::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.1);
}

.orbital-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  animation: orbit 2s linear infinite;
}

.orbital-dot:nth-child(1) {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 0s;
}
.orbital-dot:nth-child(2) {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  animation-delay: 0.67s;
}
.orbital-dot:nth-child(3) {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 1.33s;
}

.center-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: radial-gradient(
    circle,
    rgba(46, 85, 137, 0.3) 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite alternate;
}

.floating-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #42abe4, #42abe4);
  border-radius: 50%;
  animation: float 4s infinite ease-in-out;
}

.particle:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}
.particle:nth-child(2) {
  top: 60%;
  right: 15%;
  animation-delay: 0.8s;
}
.particle:nth-child(3) {
  bottom: 30%;
  left: 20%;
  animation-delay: 1.6s;
}
.particle:nth-child(4) {
  top: 40%;
  right: 25%;
  animation-delay: 2.4s;
}
.particle:nth-child(5) {
  bottom: 20%;
  right: 10%;
  animation-delay: 3.2s;
}

.loading-text {
  font-weight: 500;
  color: #050505;
  letter-spacing: 0.5px;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
}

@keyframes rotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes orbit {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) translateX(22px) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg) translateX(22px)
      rotate(-360deg);
  }
}

@keyframes glow {
  0% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* dimmed background with blur */
.v-overlay__scrim {
  backdrop-filter: blur(6px);
}
</style>
