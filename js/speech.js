/**
 * Museus Illes Balears — Web Speech API (TTS)
 * Llegeix en veu alta la descripció del museu obert al modal.
 */
(function () {
  'use strict';

  /** Enllaça el botó #btn-tts-museu (si existeix) amb la utterance corresponent. */
  function bindTTS(descriptionPlain) {
    const btn = document.getElementById('btn-tts-museu');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const clean = (descriptionPlain || '').replace(/\s+/g, ' ').trim();
      if (!clean) return;

      if (!window.speechSynthesis) {
        Utils.showToast(
          'La lectura en veu alta no està disponible (cal HTTPS o un navegador compatible).',
          'error'
        );
        return;
      }

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    });
  }

  window.MuseusApp.speech = { bindTTS };
})();
