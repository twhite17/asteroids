// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/*

  My Asteroids Game:

        About How I designed this :

          When I started this I initially had 3 observables all which accessed a bunch of variables stored outside of themselves
          at interspersing moments and that didn't really do anything to maintain functional purity. 

          I then moved to what I think is a slightly better approach, where a single object named "GameState" is passed through the observables.
          This contains all vectors and Elems and other parameters needed for the game to function.
          GameState is also stored globally, where it is updated at the end of the observer chain, so it can be loaded again and passed through
          The observer chain all over again. 

          This approch is kindof clunky however, since every time a map or subscribe or other function is called I have to.
          deconstruct this object and reconstruct it again at the end, making sure not to lose anything in the process.
          I cannot modify these objects as that would make the functions impure.

          It may be possible to compensate for this by finding a better way to store the data, but unfortunately I wasn't able to come up with anything.

          I also wrote a single "render" function which takes the gamestate and updates all information in the svg in one function call. 
          (which I think is a neat way to do it)



          

  
*/







/* 
    Just an Idea: I would like to replace my entire vector class with something like this, but unfortunately I've already
    written most of my code with an (kind of) object oriented implmentation so changing it all over is kind of impractical with the time I have left.
    I think I have learned alot from this assignment. My first attempt at this was pretty bad and didnt meet much criteria at all. 
    This is my second big re-write, and after doing this I still realised that there is so much more I could do to improve my code.
*/

const newVector = (x: number, y: number) => (f:(x: number, y:number) => any) => f(x,y);
const getX = (x : number, _: number) => x;
const getY = (_ : number, y:number) => y;


/* All Global constant declarations */
const pi = Math.PI;
const degreeOffset = 0; // this just helps make trig a little less confusing since 0 degrees is now up instead of to the right
const accelerationMagnitude = 150;

const maxVelocityMagnitude = 120;
const turnSpeed = 180;

const frameRate = Math.floor(1000/30);


/* All Class and Interface Declarations */

// This class is pure, no functions inside it have side effects
// I wont be documenting every function in this since you're definitely familiar with vectors so I'll just explain non trivial stuff
class Vector{

  x : number;
  y : number;

  constructor(x : number = 0, y : number = 0){
    this.x = x;
    this.y = y;
  }

  add(other :Vector) : Vector {return new Vector(this.x + other.x, this.y + other.y);}
  multiply(val : number) : Vector {return new Vector(this.x * val, this.y * val);} // multiplies vector by constant
  multiplyByOther(other : Vector) : Vector {return new Vector(this.x * other.x, this.y * other.y);} // multiples vector by other vector

  // creates a new vector using a magnitude and direction (degrees) instead of an x and y
  setByDirection(magnitude : number, direction : number){
    return new Vector( 
      magnitude * Math.cos(pi * (direction + degreeOffset) / 180),
      magnitude * Math.sin(pi * (direction + degreeOffset) / 180)
    );
  }
  set(x : number, y: number) : Vector{return new Vector(x, y);} // sets the value
  unitVector() : Vector{return new Vector(this.x / this.getMagnitude(), this.y / this.getMagnitude());}
  getX() : number {return this.x;}
  getY() : number {return this.y;}
  getMagnitude() : number{return Math.sqrt(this.x**2 + this.y**2);} // gets the magnitude of the vector

  // returns the angle that the vector is facing
  getAngle() : number{try {
    if(this.x < 0){
      return (Math.atan(this.y / this.x) * 180 / pi) + 180;
    }else{
      return (Math.atan(this.y / this.x) * 180 / pi);
    }
    }catch {return 1;}};
  
  // if the vectors x or y values go outside of the specified range they will be wrapped around again
  bounded(xmin : number, xmax:number , ymin:number, ymax:number) : Vector{
    return new Vector(
      this.x > xmax ? this.x - xmax : (this.x < ymin ? this.x + xmax: this.x),
      this.y > ymax ? this.y - ymax : (this.y < ymin ? this.y + ymax : this.y)
    )
  }
  // if the vector exceeds the given magnitude it will be reduced but it's directions will be scaled proportinally
  maxMagnitude(mag : number) : Vector{
    return this.getMagnitude() > mag ? this.unitVector().multiply(mag) : this;
  }

  // get magnitude of the distance between two vectors
  difference(other : Vector) : number{
    return Math.sqrt((other.getY() - this.y)**2 + (other.getX() - this.x)**2);
  }
}



  
// creates an asteroid which can be added to the asteroid list
function createAsteroid(asLocation: Vector, asVelocity : Vector, size : number) : Asteroid{
    const svg = document.getElementById("canvas")!;
    // make a group for the spaceship and a transform to move it and rotate it
    // to animate the spaceship you will update the transform property
    let g = new Elem(svg,'g')
      .attr("transform","translate(0 0) rotate(0)");

    return {
      location : asLocation,
      velocity : asVelocity,
      radius : size,
      shape : new Elem(svg, 'circle', g.elem)
      .attr("cx", "0").attr("cy", "0")
      .attr("r", `${size}`).attr("fill", "grey")

    } as Asteroid;
}

interface KeyBoard{
  [index : string] : Boolean; // Needed to index the object because typescript is a pain.
  w: Boolean,
  a: Boolean,
  d: Boolean,
  space: Boolean
};

interface GameObject{
  location : Vector,
  velocity : Vector,
  shape : Elem,
  radius : number
}

interface Ship extends GameObject{
  acceleration: Vector
};

interface Asteroid extends GameObject{};

interface Bullet extends GameObject{};

interface GameState{
  ship : Ship,
  asteroidList : Asteroid[],
  bullet : Bullet,
  keyBoard : KeyBoard,
  gameOver : Boolean
  remove? : Asteroid[]
}

function asteroids() {

  /* Defining initial state of the game */

  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g = new Elem(svg,'g')
  .attr("transform","translate(0 0) rotate(0)");


  let keyBoardInput = {
    'w': false,
    'a': false,
    'd': false,
    'space': false
  } as KeyBoard;

  // Where everything regarding the ship is stored
  let shipObject = {
    location: new Vector(300, 300),
    velocity: new Vector().setByDirection(1, 0),
    acceleration : new Vector().setByDirection(accelerationMagnitude, 0),
    shape : new Elem(svg, 'polygon', g.elem) 
        .attr("points","-15,20 15,20 0,-20")
        .attr("style","fill:lime;stroke:purple;stroke-width:1"),
    radius : 10
  } as Ship;

  let asteroidsList = [
      createAsteroid(new Vector(100, 100), new Vector().setByDirection(100, 1), 30),
      createAsteroid(new Vector(100, 500), new Vector().setByDirection(100, 160), 18),
      createAsteroid(new Vector(400, 350), new Vector().setByDirection(100, 270), 35),
      createAsteroid(new Vector(400, 200), new Vector().setByDirection(100, 75), 25)

  ] as Asteroid[];

  let bulletObject = {
    location : new Vector(-100, -100),
    velocity : new Vector(0, 0),
    shape : new Elem(svg, "circle")
      .attr("cx", "0").attr("cy", "0").attr("r", "3").attr("fill", "white"),
    radius : 3
  } as Bullet;

  // this is what will be passed down the mainloop observer chain
  let externalGameState = {
    ship : shipObject,
    asteroidList : asteroidsList,
    bullet : bulletObject,
    keyBoard : keyBoardInput,
    gameOver : false
  } as GameState;

  const endGameMsg = new Elem(svg, "text").attr("x", "0").attr("y","0").attr("fill", "red").setContent("Game Over");
  /*
      This Function is responsible for making all changes to the document after the game state has been updated.
      With the exception of the keyboard observers this is the only function that has side effects.
  */
  function render({ship, asteroidList, bullet, remove, gameOver} : GameState) : void{

      if(gameOver){
        endGameMsg.attr("transform", "translate(250,250)");
      }

      // update ship shape location
      ship.shape.attr("transform", `translate(${ship.location.getX()},${ship.location.getY()}) rotate(${ship.acceleration.getAngle() + 90})`);

      // update all asteroid shape locations
      asteroidList.forEach(
        a => {
          a.shape.attr("transform", `translate(${a.location.getX()},${a.location.getY()})`);
        }
      )
      
      // removes the shapes of the destroyed obejcts from the svg
      if(remove != undefined){
        remove.forEach(
          a => {
            a.shape.destroy();
            if(a.radius > 20){
              externalGameState.asteroidList.push(createAsteroid(a.location, new Vector().setByDirection(a.velocity.getMagnitude()*2, a.velocity.getAngle() + 45), a.radius / 2));
              externalGameState.asteroidList.push(createAsteroid(a.location, new Vector().setByDirection(a.velocity.getMagnitude()*2, a.velocity.getAngle() - 45), a.radius / 2));
            }
          }
        )
      };

      // update bullet shape location
      bullet.shape.attr("transform", `translate(${bullet.location.getX()},${bullet.location.getY()})`);

  }

  /*
    Obserable that updates a keyBoard object on a keydown event
    Used to pass keyboard information into main observable chain
  */
  const onKeyDown =  Observable.fromEvent<KeyboardEvent>(document, "keydown")
    .map(event => event.key)
    .map(key => key == ' ' ? "space" : key)
    .filter(key => key in keyBoardInput)
    .subscribe((key) => {
      externalGameState.keyBoard[key] = true;
    });

  /*
    Obserable that updates a keyBoard object on a keyup event
    Used to pass keyboard information into main observable chain
  */
  const onKeyUp = Observable.fromEvent<KeyboardEvent>(document, "keyup")
  .map(event => event.key)
  .map(key => key == ' ' ? "space" : key)
  .filter(key => key in keyBoardInput)
  .subscribe((key) => {
    externalGameState.keyBoard[key] = false;
  });

  const mainLoop = Observable.interval(frameRate)
    .map(time=>externalGameState) // Note that gameState is a global variable, this is in effect loading the state of the previous frame.

    // updates all of the locations, velocities and directions of the game.
    .map(({ship, asteroidList, bullet, keyBoard})=>{
      const newShip = {
        acceleration : keyBoard.d 
            ? new Vector().setByDirection(ship.acceleration.getMagnitude(), ship.acceleration.getAngle() + turnSpeed*frameRate/1000) 
            : keyBoard.a
                ? new Vector().setByDirection(ship.acceleration.getMagnitude(), ship.acceleration.getAngle() - turnSpeed*frameRate/1000)
                : ship.acceleration,
        velocity : keyBoard.w 
            ? ship.velocity.add(ship.acceleration.multiply(frameRate/1000)).maxMagnitude(maxVelocityMagnitude)
            : ship.velocity,
        location : ship.location.add(ship.velocity.multiply(frameRate/1000)).bounded(0, 600, 0, 600),
        shape : ship.shape,
        radius : ship.radius
      } as Ship;

      let newBullet = {}; // any mofifications to to this is constrained within the function
      
      // checks whether or not a bullet can be shot and if it can (and the used presses space) fires it
      if(keyBoard.space && (bullet.velocity.getMagnitude() === 0)){
        newBullet = {
          location : ship.location,
          velocity : ship.acceleration.multiply(2),
          shape : bullet.shape,
          radius : bullet.radius
        } as Bullet;
      }else{
        // If it cannot the bullet position is update (this does nothing when there is no bullet on the screen)
        newBullet = {
          location : bullet.location.add(bullet.velocity.multiply(frameRate/1000)),
          velocity : bullet.velocity,
          shape: bullet.shape,
          radius : bullet.radius
        } as Bullet;
      }

      // updating asteroid locations
      const newAsteroids = asteroidList.map<Asteroid>((e: Asteroid) => {
        return {
          location : e.location.add(e.velocity.multiply(frameRate/1000)).bounded(0, 600, 0, 600),
          velocity : e.velocity,
          radius : e.radius,
          shape : e.shape
        };
      }) as Asteroid[];

      return {ship : newShip, asteroidList : newAsteroids, bullet: newBullet, keyBoard :keyBoard} as GameState;
    })

    // Checks for any collisions that may have occurred.
    .map(({ship, asteroidList, bullet, keyBoard})=>{
      
      // checks if the ship has collided with any asteroids by mapping their differences and checking if its is less than the sums of the radii
      // If this is true for any asteroid the ship has hit an asteroid therefore the game must end.
      // this collision checking method approximates everything as a circle, which I think is good enough.
      const ended = asteroidList.map(
        a => a.location.difference(ship.location) < a.radius + ship.radius
      )
      .reduce(
        (prev : Boolean, curr : Boolean) : Boolean => prev || curr, false
      );
      
      //  gets asteroids that havent been shot
      const newAsteroidList = asteroidList.filter(
        a => a.location.difference(bullet.location) >= a.radius + bullet.radius
      );
      
      // finds asteroids that have been shot (is currently colliding with a bullet)
      const removeList = asteroidList.filter(
        a => a.location.difference(bullet.location) < a.radius + bullet.radius
      )
      
      
      // checks if the bullet is outside of the screen, if it is then set its velocity to 0 and move it to -100, -100
      // from this position it is ready to be shot again
      const bx = bullet.location.getX();
      const by = bullet.location.getY();

      let newBullet = {} as Bullet;

      if(bx > 600 || bx < 0 || by > 600 || by < 0){
        newBullet = {
            location : new Vector(-100, -100),
            velocity : new Vector(0, 0),
            shape : bullet.shape,
            radius : bullet.radius
        } as Bullet;
      }else{
        newBullet = bullet;
      }

      // checks if a bullet has hit an asteroid (as opposed to asteroid hitting bullet)
      // if it has then moves the bullet to -100, -100 and sets velocity to 0
      asteroidList.forEach(
        a => {
          if(a.location.difference(bullet.location) < a.radius + bullet.radius){
            newBullet = {
              location : new Vector(-100, -100),
              velocity : new Vector(0, 0),
              shape : bullet.shape,
              radius : bullet.radius
          } as Bullet;
          }
        }
      )

      return {ship:ship, asteroidList:newAsteroidList, keyBoard:keyBoard, bullet:newBullet, gameOver:ended, remove: removeList};

    })

    // This is the only function in this observer chain with side effects
    .subscribe(gameState => {

      if(gameState.gameOver){
        render(gameState)
      }else{

        externalGameState = gameState; // so the current state can be loaded again in the next frame
        render(gameState);
      }
    })
  
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 
