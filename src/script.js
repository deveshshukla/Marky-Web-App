'use strict';

// Copyright dynamic year update
let dateYr = new Date();
$('.currYear').html(dateYr.getFullYear());

const form = $('.form');
const containerWorkouts = $('.workouts');
const inputType = $('.form__input--type');
const inputDistance = $('.form__input--distance');
const inputDuration = $('.form__input--duration');
const inputCadence = $('.form__input--cadence');
const inputElevation = $('.form__input--elevation');

const actCadence = $('.act_cadence');
const actElevation = $('.act_elevation');

let map, mapEvent;

// Blueprint Class
class Workout {
    date = new Date();
    // unique id generate: last 10 digit of curr date
    id = (Date.now() + '').slice(-10);

    constructor (coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }
};

// ==+++== Child's classes ==+++==

class RunTrack extends Workout {
    // type is now passed in rather than hard‑coded
    constructor (coords, distance, duration, cadence, type = 'running') {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.type = type; // either 'running' or 'tracking'
        
        this.calcPace();
    }

    calcPace() {
        this.pace = +(this.distance / this.duration).toFixed(2);
        return this.pace;
    }
};

class Cycling extends Workout {
    type = 'cycling';
    
    constructor (coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;

        this.calcSpeed();
    }

    calcSpeed() {
        this.speed = +(this.distance / (this.duration / 60)).toFixed(2);
        return this.speed;
    }
};


// ==+++== App class ==+++==

class App {
    workouts = [];

    constructor() {
        this.getPosition();
        form.on('submit', (e) => this.newWorkout(e));

        // Change activity metric based on activity type
        inputType.on('change', (e) => this.toggleElevationField(e));

        containerWorkouts.on('click', (e) => this.moveToPopup(e));
    }

    getPosition() {
        // Geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                let { latitude } = position.coords;
                let { longitude } = position.coords;

                let coordsArr = [latitude, longitude];
                this.loadMap(coordsArr);

            }, () => {
                alert('Unable to get your location!');
            });
        }
    }

    loadMap(coordinates) {
        map = L.map('map').setView(coordinates, 16); // Zoom level

        // Leaflet map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Handle map click
        map.on('click', this.showForm);
    }

    showForm(mapE) {
        // Show event form first
        mapEvent = mapE;
        form.removeClass('hidden');
        inputDistance.focus();
    }

    toggleElevationField(e) {
        const isRunning = e.target.value === 'running' || e.target.value === 'tracking';

        const isCycling = e.target.value === 'cycling';

        // Using Tag + Class for precise selection
        // .toggleClass('className', switch) adds class if switch is true, removes if false
        $('div.act_cadence').toggleClass('form__row--hidden', !isRunning);
        
        $('div.act_elevation').toggleClass('form__row--hidden', !isCycling);
    }

    newWorkout(e) {
        e.preventDefault();

        // Get data from --> Form
        const type = $('.form__input--type').val();
        const distance = +$('.form__input--distance').val();
        const duration = +$('.form__input--duration').val();
        const { lat, lng } = mapEvent.latlng;

        // New workout variable
        let workoutActivity;

        // Validation : Helper functions
        const validInp = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));

        const positiveInp = (...inputs) =>
            inputs.every(inp => inp > 0);

        // If workout is run/track --> create RunTrack obj
        if (type === 'running' || type === 'tracking') {
            const cadence = +$('.form__input--cadence').val();

            if (!validInp(distance, duration, cadence) || !positiveInp(distance, duration, cadence)) {
                return alert('Invalid Input!');
            }

            // pass the selected type to the constructor so the instance knows whether
            // it is a run or a tracking workout
            workoutActivity = new RunTrack([lat, lng], distance, duration, cadence, type);
        };

        // If workout is cycle --> create cycling obj
        if (type === 'cycling') {
            const elevation = +$('.form__input--elevation').val();

            if (!validInp(distance, duration, elevation) || !positiveInp(distance, duration)) {
                return alert('Invalid Input!');
            }

            workoutActivity = new Cycling([lat, lng], distance, duration, elevation);
        };

        // Add new obj to workout arr on this instance
        this.workouts.push(workoutActivity);
        console.log(this.workouts);
        
        // Render workout marker on map
        this.renderWorkoutMarker(workoutActivity);

        // Render workout on list
        this.renderWorkoutList(workoutActivity);

        // Clear form
        clearForm();
    }

    renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    riseOnHover: true,
                    autoClose: false,
                    closeOnEscapeKey: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`
                    ${
                        {
                            running: '🏃‍♂️',
                            cycling: '🚴',
                            tracking: '🧗'
                        }[workout.type] || '❓' // Fallback for unknown types
                    }

                    ${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} on ${workout.date.toLocaleDateString()}
                `)
            .openPopup();
    }

    renderWorkoutList(workout) {
        let html = ` <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} on ${workout.date.toLocaleDateString()}</h2>
          <div class="workout__details">
            <span class="workout__icon">
                ${
                    {
                        running: '🏃‍♂️',
                        cycling: '🚴',
                        tracking: '🧗'
                    }[workout.type] || '❓' // Fallback for unknown types
                }
            </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

        if (workout.type === 'running' || workout.type === 'tracking') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">
                        ${workout.pace.toFixed(1)}
                    </span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
                </li>
            `;
        };

        if (workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">
                        ${workout.speed.toFixed(1)}
                    </span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
                </li>
            `;
        };
        
        containerWorkouts.append(html);
    }

    moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        // Ignore null values
        if(!workoutEl) return;

        const workout = this.workouts.find(work => work.id === workoutEl.dataset.id);
        console.log(workout);

        // move to that marker
        map.setView(workout.coords, 16, {
            animate: true,
            pan: { duration: 1 }
        });
    }
};

const app = new App();

// Clear form & hide
function clearForm(){
    $('.form')[0].reset();
    form.addClass('hidden');
}
