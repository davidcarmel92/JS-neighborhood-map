// Initialize map variable and store icon colors from google in variables.
let map;
const defaultIcon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
const highlightedIcon = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';


//ViewModel function

var ViewModel = function() {
  /*
  View model function. This function interacts with the data and the view.
  */

  var self = this;

  //Array of marker objects.
  this.markerList = [];

  //Creats a new marker object for every object in the buildings array.
  buildings.forEach(function(index){
    self.markerList.push(new Markers(index));
  });


  // Makes a knockout obserable for the query used for the searchbar.
  this.query = ko.observable('');

  // This function filters the search results and hids markers for
  // buildings not in the search results.
  this.searchResults = ko.computed(function() {
    var filtered;
    var query = self.query();
    filtered = buildings.filter(function(i) {
      return i.name.toLowerCase().indexOf(query) >= 0;
    });
    //Sets all markers' visibility to false.
    self.markerList.forEach(function(index){
      index.marker.setVisible(false);
    });
    /*
    Compares objects in the filtered array with the objects in the
    markerList array and if they match sets marker visibility
    to true.
    */
    for(i = 0; i<self.markerList.length; i++){
      for(j = 0; j<filtered.length; j++){
        if(filtered[j].name ===self.markerList[i].title){
          // Shows only markers that appear in the filtered search.
          self.markerList[i].marker.setVisible(true);
        }
      }
    }
    return filtered;
  });

  // When building clicked on sidebar, corresponsing marker bounces
  // and its InfoWindow is opened.
  this.clickedItem = function(listItem) {
    self.markerList.forEach(function(index){
      if(index.title === listItem.name){
        map.setCenter(index.marker.getPosition());
        index.populateInfoWindow(index.marker, index.html);
        index.marker.setIcon(highlightedIcon);
        index.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
          index.marker.setIcon(defaultIcon);
          index.marker.setAnimation(null);
        }, 1400);
      }
    });
  };
};
// Markers object
var Markers = function(data) {
  /*
    This Markers object creats a new object for every item in the buildings array.
  */

  var self = this;

  this.position = data.location;
  this.title = data.name;

  // Creats new info window.
  const largeInfowindow = new google.maps.InfoWindow();

  // Creats new google maps marker with position and title.
  marker = new google.maps.Marker({
    map: map,
    position: this.position,
    title: this.title,
    icon: defaultIcon
  });

  this.marker = marker;

  let html = '';

  this.html = html;

  //url for wikipedia api with this.title as search term.
  const url =`http://en.wikipedia.org/w/api.php?action=query&origin=*&prop=pageimages&format=json&piprop=original&titles=${this.title}`;

  // Promise with fetch to return data asynchronously.
  fetch(url)
  .then(response => response.json())
  .then(addImage)
  .catch(e => error(e));

  function addImage(content){
    /*
    This function takes the data from the promise and uses the content to create
    the picture for the info window.
    */
    const page = content.query.pages;
    const pageId = Object.keys(content.query.pages)[0];

    if(typeof page[pageId].thumbnail !== 'undefined'){
      const pagePhoto = page[pageId].thumbnail.original;
      self.html = `<figure class="picture">
        <img src="${pagePhoto}" alt="${self.title}">
        <figcaption>${self.title}</figcaption>
        </figure>`;
    }
    else{
      self.html = `No images available`;
        console.log(content);
    }


  }
  function error(e){
    // Function catches errors and puts an error message in infobox infobox
    // if there is an error retrieving data.
    console.log(e);
    self.html = 'Error loading image';
  }

  /*
  Adds event listeners to markers when they are clicked and moused over.
  */
  marker.addListener('click', function(){
    //Opens info window when clicked.
    map.setCenter(this.getPosition());
    self.populateInfoWindow(this, self.html);
    var thisMarker = this;
    // Creates bounces Animation when clicked.
    thisMarker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      thisMarker.setAnimation(null);
    }, 700);
  });
  // Changes icon color when moused over.
  marker.addListener('mouseover', function(){
    this.setIcon(highlightedIcon);
  });
  marker.addListener('mouseout', function(){
    this.setIcon(defaultIcon);
  });

  // Makes popup info window with content from fetch request.
  this.populateInfoWindow = function(marker, htmlContent) {
    infowindow = largeInfowindow;
    if(infowindow.maker != marker) {
      infowindow.marker = marker;
      infowindow.setContent(`<div> ${htmlContent} </div>`);
      infowindow.open(map, marker);
      // Closes info window on click when open.
      infowindow.addListener('click', function(){
        infowindow.setMarker(null);
      });
    }
  };
};

// Initilizes map.
var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'),{
    center: {lat: 40.7380 ,lng: -73.9876},
    zoom: 13
  });
  //Applies Knockout bindings.
  ko.applyBindings(new ViewModel());
};

//Handles error for when Google maps fails to load.
var googleError = function() {
  alert('Could not connect to Google maps');
};
