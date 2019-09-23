"use strict";
const newVector = (x, y) => (f) => f(x, y);
const getX = (x, _) => x;
const getY = (_, y) => y;
const pi = Math.PI;
const degreeOffset = 0;
const accelerationMagnitude = 150;
const maxVelocityMagnitude = 120;
const turnSpeed = 180;
const frameRate = Math.floor(1000 / 30);
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(other) { return new Vector(this.x + other.x, this.y + other.y); }
    multiply(val) { return new Vector(this.x * val, this.y * val); }
    multiplyByOther(other) { return new Vector(this.x * other.x, this.y * other.y); }
    setByDirection(magnitude, direction) {
        return new Vector(magnitude * Math.cos(pi * (direction + degreeOffset) / 180), magnitude * Math.sin(pi * (direction + degreeOffset) / 180));
    }
    set(x, y) { return new Vector(x, y); }
    unitVector() { return new Vector(this.x / this.getMagnitude(), this.y / this.getMagnitude()); }
    getX() { return this.x; }
    getY() { return this.y; }
    getMagnitude() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
    getAngle() {
        try {
            if (this.x < 0) {
                return (Math.atan(this.y / this.x) * 180 / pi) + 180;
            }
            else {
                return (Math.atan(this.y / this.x) * 180 / pi);
            }
        }
        catch (_a) {
            return 1;
        }
    }
    ;
    bounded(xmin, xmax, ymin, ymax) {
        return new Vector(this.x > xmax ? this.x - xmax : (this.x < ymin ? this.x + xmax : this.x), this.y > ymax ? this.y - ymax : (this.y < ymin ? this.y + ymax : this.y));
    }
    maxMagnitude(mag) {
        return this.getMagnitude() > mag ? this.unitVector().multiply(mag) : this;
    }
    difference(other) {
        return Math.sqrt((other.getY() - this.y) ** 2 + (other.getX() - this.x) ** 2);
    }
}
function createAsteroid(asLocation, asVelocity, size) {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(0 0) rotate(0)");
    return {
        location: asLocation,
        velocity: asVelocity,
        radius: size,
        shape: new Elem(svg, 'circle', g.elem)
            .attr("cx", "0").attr("cy", "0")
            .attr("r", `${size}`).attr("fill", "grey")
    };
}
;
;
;
;
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(0 0) rotate(0)");
    let keyBoardInput = {
        'w': false,
        'a': false,
        'd': false,
        'space': false
    };
    let shipObject = {
        location: new Vector(300, 300),
        velocity: new Vector().setByDirection(1, 0),
        acceleration: new Vector().setByDirection(accelerationMagnitude, 0),
        shape: new Elem(svg, 'polygon', g.elem)
            .attr("points", "-15,20 15,20 0,-20")
            .attr("style", "fill:lime;stroke:purple;stroke-width:1"),
        radius: 10
    };
    let asteroidsList = [
        createAsteroid(new Vector(100, 100), new Vector().setByDirection(100, 1), 30),
        createAsteroid(new Vector(100, 500), new Vector().setByDirection(100, 160), 18),
        createAsteroid(new Vector(400, 350), new Vector().setByDirection(100, 270), 35),
        createAsteroid(new Vector(400, 200), new Vector().setByDirection(100, 75), 25)
    ];
    let bulletObject = {
        location: new Vector(-100, -100),
        velocity: new Vector(0, 0),
        shape: new Elem(svg, "circle")
            .attr("cx", "0").attr("cy", "0").attr("r", "3").attr("fill", "white"),
        radius: 3
    };
    let externalGameState = {
        ship: shipObject,
        asteroidList: asteroidsList,
        bullet: bulletObject,
        keyBoard: keyBoardInput,
        gameOver: false
    };
    const endGameMsg = new Elem(svg, "text").attr("x", "0").attr("y", "0").attr("fill", "red").setContent("Game Over");
    function render({ ship, asteroidList, bullet, remove, gameOver }) {
        if (gameOver) {
            endGameMsg.attr("transform", "translate(250,250)");
        }
        ship.shape.attr("transform", `translate(${ship.location.getX()},${ship.location.getY()}) rotate(${ship.acceleration.getAngle() + 90})`);
        asteroidList.forEach(a => {
            a.shape.attr("transform", `translate(${a.location.getX()},${a.location.getY()})`);
        });
        if (remove != undefined) {
            remove.forEach(a => {
                a.shape.destroy();
                if (a.radius > 20) {
                    externalGameState.asteroidList.push(createAsteroid(a.location, new Vector().setByDirection(a.velocity.getMagnitude() * 2, a.velocity.getAngle() + 45), a.radius / 2));
                    externalGameState.asteroidList.push(createAsteroid(a.location, new Vector().setByDirection(a.velocity.getMagnitude() * 2, a.velocity.getAngle() - 45), a.radius / 2));
                }
            });
        }
        ;
        bullet.shape.attr("transform", `translate(${bullet.location.getX()},${bullet.location.getY()})`);
    }
    const onKeyDown = Observable.fromEvent(document, "keydown")
        .map(event => event.key)
        .map(key => key == ' ' ? "space" : key)
        .filter(key => key in keyBoardInput)
        .subscribe((key) => {
        externalGameState.keyBoard[key] = true;
    });
    const onKeyUp = Observable.fromEvent(document, "keyup")
        .map(event => event.key)
        .map(key => key == ' ' ? "space" : key)
        .filter(key => key in keyBoardInput)
        .subscribe((key) => {
        externalGameState.keyBoard[key] = false;
    });
    const mainLoop = Observable.interval(frameRate)
        .map(time => externalGameState)
        .map(({ ship, asteroidList, bullet, keyBoard }) => {
        const newShip = {
            acceleration: keyBoard.d
                ? new Vector().setByDirection(ship.acceleration.getMagnitude(), ship.acceleration.getAngle() + turnSpeed * frameRate / 1000)
                : keyBoard.a
                    ? new Vector().setByDirection(ship.acceleration.getMagnitude(), ship.acceleration.getAngle() - turnSpeed * frameRate / 1000)
                    : ship.acceleration,
            velocity: keyBoard.w
                ? ship.velocity.add(ship.acceleration.multiply(frameRate / 1000)).maxMagnitude(maxVelocityMagnitude)
                : ship.velocity,
            location: ship.location.add(ship.velocity.multiply(frameRate / 1000)).bounded(0, 600, 0, 600),
            shape: ship.shape,
            radius: ship.radius
        };
        let newBullet = {};
        if (keyBoard.space && (bullet.velocity.getMagnitude() === 0)) {
            newBullet = {
                location: ship.location,
                velocity: ship.acceleration.multiply(2),
                shape: bullet.shape,
                radius: bullet.radius
            };
        }
        else {
            newBullet = {
                location: bullet.location.add(bullet.velocity.multiply(frameRate / 1000)),
                velocity: bullet.velocity,
                shape: bullet.shape,
                radius: bullet.radius
            };
        }
        const newAsteroids = asteroidList.map((e) => {
            return {
                location: e.location.add(e.velocity.multiply(frameRate / 1000)).bounded(0, 600, 0, 600),
                velocity: e.velocity,
                radius: e.radius,
                shape: e.shape
            };
        });
        return { ship: newShip, asteroidList: newAsteroids, bullet: newBullet, keyBoard: keyBoard };
    })
        .map(({ ship, asteroidList, bullet, keyBoard }) => {
        const ended = asteroidList.map(a => a.location.difference(ship.location) < a.radius + ship.radius)
            .reduce((prev, curr) => prev || curr, false);
        const newAsteroidList = asteroidList.filter(a => a.location.difference(bullet.location) >= a.radius + bullet.radius);
        const removeList = asteroidList.filter(a => a.location.difference(bullet.location) < a.radius + bullet.radius);
        const bx = bullet.location.getX();
        const by = bullet.location.getY();
        let newBullet = {};
        if (bx > 600 || bx < 0 || by > 600 || by < 0) {
            newBullet = {
                location: new Vector(-100, -100),
                velocity: new Vector(0, 0),
                shape: bullet.shape,
                radius: bullet.radius
            };
        }
        else {
            newBullet = bullet;
        }
        asteroidList.forEach(a => {
            if (a.location.difference(bullet.location) < a.radius + bullet.radius) {
                newBullet = {
                    location: new Vector(-100, -100),
                    velocity: new Vector(0, 0),
                    shape: bullet.shape,
                    radius: bullet.radius
                };
            }
        });
        return { ship: ship, asteroidList: newAsteroidList, keyBoard: keyBoard, bullet: newBullet, gameOver: ended, remove: removeList };
    })
        .subscribe(gameState => {
        if (gameState.gameOver) {
            render(gameState);
        }
        else {
            externalGameState = gameState;
            render(gameState);
        }
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map