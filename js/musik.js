const DEFAULT_OCTAVE = 4;
const MAX_OCTAVE = 7;
const MIN_OCTAVE = 1;
const OCTAVE_INCREMENT = 100;
const OCTAVE_DECREMENT = -100;
const DEFAULT_INSTRUMENT = { name: 'acoustic_grand_piano' };

const INSTRUMENT_KEYS = {
    'Digit1': { name: 'acoustic_grand_piano' },
    'Digit2': { name: 'bassoon', singleNote: true },
    'Digit3': { name: 'glockenspiel' },
    'Digit4': { name: 'ocarina', singleNote: true },
    'Digit5': { name: 'whistle', singleNote: true },
};

const NOTE_KEYS = {
    'KeyW': { note: 'A', octaveDelta: -1 },
    'KeyS': { note: 'A#', octaveDelta: -1 },
    'KeyX': { note: 'B', octaveDelta: -1 },
    'KeyE': { note: 'C' },
    'KeyD': { note: 'C#' },
    'KeyC': { note: 'D' },
    'KeyR': { note: 'D#' },
    'KeyF': { note: 'E' },
    'KeyV': { note: 'E' },
    'KeyT': { note: 'F' },
    'KeyG': { note: 'F#' },
    'KeyB': { note: 'G' },
    'KeyY': { note: 'G#' },
    'KeyH': { note: 'A' },
    'KeyN': { note: 'A#' },
    'KeyU': { note: 'B' },
    'KeyJ': { note: 'C', octaveDelta: 1 },
    'KeyM': { note: 'C', octaveDelta: 1 },
    'KeyI': { note: 'C#', octaveDelta: 1 },
    'KeyK': { note: 'D', octaveDelta: 1 },
};

const NOTES = [
    'C', 'C#', 'D', 'D#', 'E', 'F',
    'F#', 'G', 'G#', 'A', 'A#', 'B', 
];

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

    setCurrentOctave(DEFAULT_OCTAVE);

    Musik.instrument = {};

    registerInstrument(DEFAULT_INSTRUMENT);

    // enable recording
    Musik.record = {
        isRecording: false,
        instrumentName: DEFAULT_INSTRUMENT,
        startTime: 0,
        buffer: [],
    };

    /**
     * Creates and registers instrument in namespace
     * @param {string} name Instrument name as defined in 
     * https://raw.githubusercontent.com/danigb/soundfont-player/master/names/fluidR3.json
     * @param {boolean} singleNote true if playing new note should stop previous one 
     */
    function registerInstrument({ name, singleNote }) {
        Soundfont.instrument(Musik.ac, name, { attack: 0 }).then(instrument => {
            instrument.singleNote = !!singleNote;
            Musik.instrument = instrument;
        })
    }

    function setCurrentOctave(oct) {
        Musik.octave = oct;
        $('#current-octave')[0].innerHTML = oct;
    }

    /**
     * Adds given note to recorded tape
     * @param {string} note 
     */
    function record(note) {
        note = noteToMidiNumber(note);
        const { buffer, startTime } = Musik.record;
        const time = (Date.now() - startTime)/1000;
        buffer.push({time, note});
    }

    /**
     * Returns the note augmented of a number of half tones
     * @param {string} note 
     * @param {number} halfTonesNumber default = 1
     * @returns 
     */
    function interval(note, halfTonesNumber) {
        if (halfTonesNumber === undefined) halfTonesNumber = 1;
        let octave = note.slice(-1);
        const letter = note.slice(0, -1);
        let index = (NOTES.indexOf(letter)+halfTonesNumber);
        if (index === NOTES.length) {
            index = 0;
            octave++;
        }
        const result =  NOTES[index] + octave;
        return result;
    }

    function noteLookup(code) {
        const match = NOTE_KEYS[code];
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
        return INSTRUMENT_KEYS[code];
    }

    /**
     * Converts given not to midi number
     */
    function noteToMidiNumber(note) {
        const letter = note.slice(0,-1);
        const octave = +note.slice(-1);

        return NOTES.indexOf(letter) +12*(octave+1);
    }

    // Player Handler
    const isDown = {}; // to handle repeated key
    $(document).keydown(function (e) {
        const { code, shiftKey } = e;
        let note = noteLookup(code);

        if (!!note && !isDown[code]) {
            isDown[code] = true;
            const instrument = Musik.instrument;
            if (shiftKey) note = interval(note);

            if (instrument.singleNote) instrument.stop();
            instrument.play(note);

            if (Musik.record.isRecording) record(note);
        }
    })
    $(document).keyup(function (e) {
        isDown[e.code] = false;
    })
    // Octave Handler
    $(document).keydown(function ({ code }) {
        const match = octaveLookup(code);

        if (!!match) {
            if (match === OCTAVE_INCREMENT) {
                setCurrentOctave(Math.min(Musik.octave + 1, MAX_OCTAVE));
            } else if (match === OCTAVE_DECREMENT) {
                setCurrentOctave(Math.max(Musik.octave - 1, MIN_OCTAVE));
            } else {
                setCurrentOctave(match);
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
            case "Digit0":
                const ac = new AudioContext();
                Soundfont.instrument(ac, Musik.record.instrumentName, { attack: 0 })
                    .then(instrument => {
                        instrument.schedule(ac.currentTime,
                            Musik.record.buffer);
                });
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
    // Recorder Handler
    $(document).keydown(function ({ code }) {
        if (code === "NumpadEnter") {
            Musik.record.isRecording = !Musik.record.isRecording;

            if (Musik.record.isRecording) {
                console.log("**** Recording started ****");
                Musik.record.startTime = Date.now();
                Musik.record.buffer = [];
                Musik.record.instrumentName = Musik.instrument.name;
            } else {
                console.log("**** Recording end ****");
                console.log(Musik.record.buffer);
            }
        }
    });

    // SVG click handler
    /*document.getElementsByTagName('object')[0]
        .getSVGDocument()
        .addEventListener('key_select', function (e) { console.log(e.detail) });*/
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
