class World
  constructor: (level) ->
    background = new Image()
    background.src = './img/background.png'

    midground = new Image()
    midground.src = './img/midground.png'

    foreground = new Image()
    foreground.src = './img/foreground.png'

    @backgroundLayers = [background, midground, foreground]

    @collisionObjects = [
      {
        collision: {
          shape: 'rect'
          type: 'platform'
          x: 0
          y: 500
          width: 2048
          height: 100
        }
      },

      {
        collision: {
          shape: 'rect'
          type: 'platform'
          x: 600
          y: 400
          width: 300
          height: 40
        }
      },

      {
        collision: {
          shape: 'rect'
          type: 'obstacle'
          x: 800
          y: 480
          width: 300
          height: 40
        }
      },

      {
        collision: {
          shape: 'rect'
          type: 'obstacle'
          x: 900
          y: 460
          width: 300
          height: 40
        }
      },

      {
        collision: {
          shape: 'rect'
          type: 'obstacle'
          x: 1000
          y: 440
          width: 300
          height: 60
        }
      },

      {
        collision: {
          shape: 'rect'
          type: 'obstacle'
          x: 100
          y: 400
          width: 250
          height: 40
        }
      }
    ]