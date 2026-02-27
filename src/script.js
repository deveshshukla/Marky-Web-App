'use strict';

// Copyright dynamic year update
let dateYr = new Date();
$('.currYear').html(dateYr.getFullYear());


// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    type = 'running';
    
    constructor (coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        
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
let workouts = []; 

class App {
    constructor() {
        this.getPosition();
        form.on('submit', (e) => this.newWorkout(e));

        // Change activity metric based on activity type
        inputType.on('change', (e) => this.toggleElevationField(e));
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

            workoutActivity = new RunTrack([lat, lng], distance, duration, cadence);
        };

        // If workout is cycle --> create cycling obj
        if (type === 'cycling') {
            const elevation = +$('.form__input--elevation').val();

            if (!validInp(distance, duration, elevation) || !positiveInp(distance, duration)) {
                return alert('Invalid Input!');
            }

            workoutActivity = new Cycling([lat, lng], distance, duration, elevation);
        };

        // Add new obj to workout arr
        workouts.push(workoutActivity);
        console.log(workoutActivity);
        
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
            .setPopupContent(`${workout.type} activity`)
            .openPopup();
    }

    renderWorkoutList(workout) {
        const html = ` <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} on ${workout.date.toLocaleDateString()}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        </li> `;
        
        containerWorkouts.append(html);
    }
};

const app = new App();

// Clear form & hide
function clearForm(){
    $('.form')[0].reset();
    form.addClass('hidden');
}
