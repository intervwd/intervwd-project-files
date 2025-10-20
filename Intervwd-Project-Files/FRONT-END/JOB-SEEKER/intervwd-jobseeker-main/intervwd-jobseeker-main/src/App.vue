<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<style>
@import "@/css/styles.css";
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
} */
.fontsize8px {
  font-size: 8px !important;
}
.fontsize10px {
  font-size: 10px !important;
}
.fontsize12px {
  font-size: 12px !important;
}
.fontsize13px {
  font-size: 13px !important;
}
.fontsize14px {
  font-size: 14px !important;
}
.fontsize15px {
  font-size: 15px !important;
}
.fontsize16px {
  font-size: 16px !important;
}
.fontsize17px {
  font-size: 17px !important;
}
.fontsize18px {
  font-size: 18px !important;
}
.fontsize20px {
  font-size: 20px !important;
}
.fontsize25px {
  font-size: 25px !important;
}
.fontsize30px {
  font-size: 30px !important;
}
.CardBorderRadius {
  border-radius: 20px !important;
}
.BtnBorderRadius {
  border-radius: 10px !important;
}
.CursorPointer {
  cursor: pointer !important;
}
.auth-page {
  min-height: 100vh;
  background-color: #f0faf6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.MainPage {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
}
.FontWeight400 {
  font-weight: 400 !important;
}
.FontWeight500 {
  font-weight: 500 !important;
}
.BorderRadius10Px {
  border-radius: 10px !important;
}
.CardHover:hover {
  border: 1px solid #1ca54e !important;
  background-color: #f0faf6 !important;
  cursor: pointer !important;
}
.heading {
  font-family: Roboto, "Helvetica Neue", Arial, sans-serif !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  line-height: 24px !important;
}

.v-btn {
  font-family: Roboto, "Helvetica Neue", Arial, sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important; /* disable uppercase if needed */
}
.mainButton {
  font-family: Roboto, "Helvetica Neue", Arial, sans-serif !important;
  color: grey !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important; /* disable uppercase if needed */
}
.cardOutline {
  border: 1px solid #1ca54e !important;
}
.DisabledBtn {
  cursor: not-allowed !important;
  opacity: 0.6 !important; /* dim the button */
  pointer-events: auto !important; /* allow cursor to show even though it's disabled */
}
</style>
