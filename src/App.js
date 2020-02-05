import React from 'react';
import logo from './logo.svg';
import './App.css';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiaXJvc2VuYiIsImEiOiJFWjhEY0NVIn0.vLbckpy27jsele4bzz7x6Q';


class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      lng: -122.43877,
      lat: 37.75152,
      zoom: 11.5,
      name: "",
      stops: [],
      selected_line: "",
    }

    this.onClick = this.onClick.bind(this);
    this.fetchMuniRoutes = this.fetchMuniRoutes.bind(this);
  }

  onClick(name, stops) {
    this.setState({name: name, stops: stops })
  }

  fetchMuniRoutes(map) {
    const that = this;
    fetch("https://transit.land/api/v1/routes.geojson?operated_by=o-9q8y-sfmta&per_page=false")
      .then((response) => response.json())
      .then((responseJson) => {
        let muni_routes = responseJson['features'];
        var coordinates = [];
        muni_routes.forEach(element => {
          if (element.id.includes('owl') || element.id.includes('bus')) {
            return
          }
          console.log(element);
          map.addSource(element.id, {type: 'geojson', data: element})

          map.addLayer({
            'id': element.id,
            "type": "line",
            'source': element.id,
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#B70120',
              'line-width': 3
            }
          });

          map.on('click', element.id, (e) => {
            var features = e.features[0].properties;

            var name = features.name
            var tags = JSON.parse(features.tags)
            name = name.concat(' ' + tags.route_long_name)
            var stops_json = JSON.parse(e.features[0].properties.stops_served_by_route);
            var stops = [];
            stops_json.forEach((stop, i) => {
              if (!stops.includes(stop.stop_name)) {
                stops.push(stop.stop_name)
              }
            });
            console.log(features.onestop_id);
            // Change back previously selected line to normal color
            map.setPaintProperty(this.state.selected_line, 'line-color', '#B70120')

            this.setState({selected_line: element.id})
            map.removeLayer(element.id);

            map.addLayer({
              'id': element.id,
              "type": "line",
              'source': element.id,
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': 'orange',
                'line-width': 3
              }
            });

            console.log(e.features[0]);

            this.onClick(name, stops)
          })
        });
        that.setState({coords: coordinates, muni: muni_routes});
      })
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });

    map.on('move', () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      })
    })

    map.on('load', () => {
      // map.addSource("muni", {type: 'geojson', data: 'https://transit.land/api/v1/routes.geojson?operated_by=o-9q8y-sfmta&per_page=false'})
      this.fetchMuniRoutes(map);
    })
  }

  render() {
    return (
      <div>
        <div ref={el => this.mapContainer = el} className="mapContainer"></div>
        <div className="route">
          <h3>{this.state.name}</h3>
          <ul>
            {this.state.stops.map((stop) =>
              <li><span></span>{stop}</li>
            )}
          </ul>
        </div>
      </div>
    );
  }


}

export default App;
