const DEFAULT_OCTAVE = 4;
const MAX_OCTAVE = 7;
const MIN_OCTAVE = 1;
const OCTAVE_INCREMENT = 100;
const OCTAVE_DECREMENT = -100;
const DEFAULT_INSTRUMENT = { name: 'acoustic_grand_piano' };

const instrumentKeys = {
    'Digit1': { name: 'acoustic_grand_piano' },
    'Digit2': { name: 'bassoon', singleNote: true },
    'Digit3': { name: 'glockenspiel' },
    'Digit4': { name: 'ocarina', singleNote: true },
};

const noteKeys = {
    'KeyW': { note: 'A', octaveDelta: -1 },
    'KeyS': { note: 'A#', octaveDelta: -1 },
    'KeyX': { note: 'B', octaveDelta: -1 },
    'KeyE': { note: 'C' },
    'KeyD': { note: 'C#' },
    'KeyC': { note: 'D' },
    'KeyR': { note: 'D#' },
    'KeyF': { note: 'E' },
    'KeyV': { note: 'F' },
    'KeyT': { note: 'F#' },
    'KeyG': { note: 'G' },
    'KeyB': { note: 'G#' },
    'KeyY': { note: 'A' },
    'KeyH': { note: 'A#' },
    'KeyN': { note: 'B' },
    'KeyU': { note: 'C', octaveDelta: 1 },
    'KeyJ': { note: 'C#', octaveDelta: 1 },
    'KeyM': { note: 'D', octaveDelta: 1 },
};

const octaveKeys = {
    'ArrowRight': OCTAVE_INCREMENT,
    'ArrowLeft': OCTAVE_DECREMENT,
    'Numpad4': 3,
    'Numpad5': 2,
    'Numpad6': 1,
    'Numpad0': 4,
    'Numpad1': 5,
    'Numpad2': 6,
    'Numpad3': 7,
};

// Using 'Musik' as a namespace to prevent side effects with window
$(document).ready(function () {
    const Musik = this;
    // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
    Musik.ac = new AudioContext();

    Musik.octave = DEFAULT_OCTAVE;

    Musik.instrument = {};

    registerInstrument(DEFAULT_INSTRUMENT)

    /**
     * Creates and registers instrument in namespace
     * @param {string} name Instrument name as defined in 
     * https://raw.githubusercontent.com/danigb/soundfont-player/master/names/fluidR3.json
     * @param {boolean} isSingleNote true if playing new note should stop previous one 
     */
    function registerInstrument({ name, singleNote }) {
        Soundfont.instrument(Musik.ac, name).then(instrument => {
            instrument.singleNote = !!singleNote;
            Musik.instrument = instrument;
        })
    }

    function noteLookup(code) {
        const match = noteKeys[code];
        if (match) {
            let { note, octaveDelta = 0 } = match;
            const octave = Musik.octave + octaveDelta;

            return `${note}${octave}`;
        }
    }

    function octaveLookup(code) {
        return octaveKeys[code];
    }

    function instrumentLookup(code) {
        return instrumentKeys[code];
    }

    // Player Handler
    $(document).keydown(function ({ code }) {
        const note = noteLookup(code);

        if (!!note) {
            const instrument = Musik.instrument;

            if (instrument.singleNote) instrument.stop();
            instrument.play(note);
        }
    })
    // Octave Handler
    $(document).keydown(function ({ code }) {
        const match = octaveLookup(code);

        if (!!match) {
            if (match === OCTAVE_INCREMENT) {
                Musik.octave = Math.min(Musik.octave + 1, MAX_OCTAVE);
            } else if (match === OCTAVE_DECREMENT) {
                Musik.octave = Math.max(Musik.octave - 1, MIN_OCTAVE);
            } else {
                Musik.octave = match;
            }
        }
    })
    // SingleNote Handler
    $(document).keydown(function ({ code }) {
        switch (code) {
            case "NumpadDecimal":
                Musik.instrument.singleNote = !Musik.instrument.singleNote;
                break;
            case "Space":
                Musik.instrument.stop();
                break;
            default:
                break;
        }
    })
    // Instrument Handler
    $(document).keydown(function ({ code }) {
        const instrument = instrumentLookup(code);

        if (!!instrument) {
            registerInstrument(instrument);
        }
    });

    // SVG click handler
    document.getElementsByTagName('object')[0]
        .getSVGDocument()
        .addEventListener('key_select', function (e) { console.log(e.detail) });
    // SVG on mouse over
    document.getElementsByTagName('object')[0]
        .getSVGDocument()
        .addEventListener('key_over', function ({ detail }) {
            let mapping = noteLookup(detail);

            if (mapping) {
                $('#mapping-type')[0].innerHTML = 'NOTE';
                $('#mapping-value')[0].innerHTML = mapping;
            } else {
                mapping = instrumentLookup(detail);
                if (mapping) {
                    $('#mapping-type')[0].innerHTML = 'INSTRUMENT';
                    $('#mapping-value')[0].innerHTML = mapping.name;
                } else {
                    mapping = octaveLookup(detail);
                    if (mapping) {
                        $('#mapping-type')[0].innerHTML = 'OCTAVE';
                        $('#mapping-value')[0].innerHTML = mapping;
                    } else {
                        $('#mapping-type')[0].innerHTML = 'N/A';
                        $('#mapping-value')[0].innerHTML = 'N/A';
                    }
                }
            }
        });
})
