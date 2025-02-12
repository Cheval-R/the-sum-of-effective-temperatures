// Карта
InitMap();
export let
  marker,
  map;
// Инициализация маркера
const markerElement = document.createElement('div');
markerElement.className = 'marker-class';

// Инициализация карты
async function InitMap() {
  await ymaps3.ready;

  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = ymaps3;

  //  * Инициализация карты
  map = new YMap(
    document.getElementById('map'),
    {
      location: {
        center: [49.121358, 55.786949],
        zoom: 10
      },
    }
  );

  // * Добавляем слои
  // Слой с дорогами и зданиями
  map.addChild(new YMapDefaultSchemeLayer());
  // Слой для маркеров
  map.addChild(new YMapDefaultFeaturesLayer());

  const DragOnCallback = (coordinates) => {
    marker.update({
      coordinates: coordinates,
    })

    longitude.value = coordinates[0].toFixed(6);
    latitude.value = coordinates[1].toFixed(6);
  }

  marker = new YMapMarker(
    {
      coordinates: [49.121358, 55.786949],
      draggable: true,
      onDragMove: DragOnCallback,
    },
    markerElement,
  );
  map.addChild(marker);

  const ClickCallback = (object, event) => {
    const coordinates = event.coordinates;

    marker.update({
      coordinates: coordinates,
    })

    longitude.value = coordinates[0].toFixed(6);
    latitude.value = coordinates[1].toFixed(6);

  }
  // * Создаём слушатель событий
  const mapListener = new YMapListener({
    layer: 'any',
    onClick: ClickCallback,
  });
  // * Добавляем слушатель на карту
  map.addChild(mapListener);
}