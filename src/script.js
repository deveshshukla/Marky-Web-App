'use strict';

// Copyright dynamic year update
let date = new Date();
$('.currYear').html(date.getFullYear());


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


class App {
    constructor() {
        this.getPosition();
        form.on('submit', this.newWorkout);

        // Change activity metric based on activity type
        inputType.on('change', this.toggleElevationField);
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
            
        // Clear form
        clearForm();
        
        // Display marker
        const { lat, lng } = mapEvent.latlng;

        L.marker([lat, lng])
            .addTo(map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    riseOnHover: true,
                    autoClose: false,
                    closeOnEscapeKey: false,
                    closeOnClick: false,
                    className: 'tracking-popup',
                })
            )
            .setPopupContent('Tracking Event')
            .openPopup();
    }
};

const app = new App();

// Clear form & hide
const clearForm = () => {
    $('.form')[0].reset();
    form.addClass('hidden');
}
