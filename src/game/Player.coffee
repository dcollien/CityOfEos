class Player
	constructor: (@pos) ->
    @animations =
      walking: {
        src: './img/walking.png'
        frames: 8
        frameSpeed: (v) => Math.abs(v.x) * 0.3
        repeat: 'loop'
        offset: 3
      }

      standing: {
        src: './img/standing.png'
        frames: 1
        frameSpeed: (v) => 0
        repeat: 'once'
        offset: 0
      }

      jumping: {
        src: './img/jumping.png'
        frames: 6
        frameSpeed: (v) => 3
        repeat: 'once'
        offset: 0
      }

      landing: {
        src: './img/landing.png'
        frames: 2
        frameSpeed: (v) => 2
        repeat: 'continue'
        next: 'walking'
        offset: 0
      }

    for animation of @animations
      @animations[animation].img = new Image()
      @animations[animation].img.src = @animations[animation].src

    @currentSequence = 'walking'
    @frameHeight = 64
    @frameWidth  = 64
    @frameOffset = 64

    @framePeriod = 0.1
    @frameTime = 0
    @currentFrame = 0

    @updatePeriod = 0.01
    @updateTime = 0

    @friction = 0.1

    @gravity = 0.7

    @jumpImpulse = 16
    @moveAccel = 0.5

    @blocked = false

    @maxSpeed = 4

    @width = 192
    @height = 192

    @collision = => 
      {
        shape: 'rect'
        width: @width/4
        height: @height
        x: @pos.x - @width/8
        y: @pos.y - @height
      }

    @velocity = v 0, 0
    @direction = 1
    @inAir = false

  drawFrame: (ctx, frameNum) ->
    posX = -@width/2
    posY = -@height

    ctx.drawImage @animations[@currentSequence].img, (@frameOffset*frameNum), 0, @frameWidth, @frameHeight, posX+@width/10, posY, @width, @height

  draw: (ctx) ->
    ctx.scale @direction, 1

    @drawFrame ctx, @currentFrame

  changeSequence: (sequence) ->
    @currentSequence = sequence
    @currentFrame = @animations[sequence].offset
    @frameTime = @framePeriod

  handleAnimation: ->
    switch @animations[@currentSequence].repeat
      when 'loop'
        @currentFrame = (@currentFrame + 1) % @animations[@currentSequence].frames
      when 'once'
        @currentFrame = Math.min (@currentFrame + 1), @animations[@currentSequence].frames-1
      when 'pingpong'
        if (@currentFrame <= 0)
          @frameDir = 1
        else if (@currentFrame >= @animations[@currentSequence].frames-1)
          @frameDir = -1
        else
          @frameDir = @frameDir or 1

        @currentFrame += @frameDir
      when 'pingpong once'
        if (@currentFrame <= 0) and (@frameDir is -1)
          @currentFrame = 0
          @frameDir = 0
        else if (@currentFrame >= @animations[@currentSequence].frames-1)
          @frameDir = -1
        else
          @frameDir = @frameDir or 1

        @currentFrame += @frameDir
      when 'continue'
        @currentFrame += 1
        if (@currentFrame >= @animations[@currentSequence].frames)
          @changeSequence @animations[@currentSequence].next

  handleCollisions: (collisions) ->
    playerBox = @collision()

    playerTop = playerBox.y
    playerBottom = playerBox.y + playerBox.height
    playerLeft = playerBox.x
    playerRight = playerBox.x + playerBox.width

    ground = playerBottom
    grounded = false

    @blocked = false
    for collision in collisions
      boxTop = collision.y
      boxBottom = boxTop + collision.height
      boxLeft = collision.x
      boxRight = boxLeft + collision.width
      if (playerBottom >= boxTop) and (playerBottom < boxBottom) and @velocity.y >= 0
        # falling onto a collision box
        ground = Math.min boxTop, ground
        grounded = true
      else if collision.type is 'obstacle' and (playerBottom >= boxTop + 0.1)
        # walking into an obstacle
        if (playerRight >= boxLeft) and (playerRight < boxRight)
          @pos.x -= (playerRight - boxLeft)
          @blocked = true
        else if (playerLeft <= boxRight) and (playerLeft > boxLeft)
          @pos.x += (boxRight - playerLeft)
          @blocked = true

    if @blocked
      @velocity.x = 0
      if not @inAir
        @changeSequence 'standing'

    if grounded
      if @inAir
        @inAir = false
        @changeSequence 'landing'
      
      # ground speed limiting
      if (Math.abs(@velocity.x) > @maxSpeed)
        @velocity.x = (@velocity.x/Math.abs(@velocity.x)) * @maxSpeed

      @velocity.y = 0
      @pos.y = ground
    else
      @inAir = true

  update: (dt, collisions) ->
    collided = (collisions.length isnt 0)

    if (atom.input.pressed 'jump') and not @inAir
      @inAir = true
      @changeSequence 'jumping'
      @velocity.y = -@jumpImpulse + (Math.abs @velocity.x)
      @velocity.x *= 1.5

    if (@frameTime <= 0)
      @frameTime = @framePeriod
      @handleAnimation()

    if (@updateTime <= 0)
      @updateTime = @updatePeriod

      if (atom.input.down 'left') or (atom.input.down 'right')
        if (@currentSequence isnt 'walking') and (@currentSequence isnt 'landing') and not (@inAir or @blocked)
          @changeSequence 'walking'

        if atom.input.down 'left'
          @velocity.x -= @moveAccel if (@velocity.x > -@maxSpeed)
        if atom.input.down 'right'
          @velocity.x += @moveAccel if (@velocity.x < @maxSpeed)
      else
        if (aboutZero @velocity.x, @moveAccel)
          if not @inAir and @currentSequence isnt 'landing'
            @changeSequence 'standing'

          @velocity.x = 0
        else
          @velocity.x = lerp @friction, @velocity.x, 0
      
      if @velocity.x isnt 0
        @direction = @velocity.x/Math.abs(@velocity.x)

      @velocity.y += @gravity
      @pos = v.add @pos, @velocity

      @handleCollisions collisions


      

    @updateTime -= dt
    @frameTime -= @animations[@currentSequence].frameSpeed(@velocity) * dt
