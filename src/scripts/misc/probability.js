

class Probability {
    constructor(prob) {
        //Probability is a number from 0 to 1
        this.probabiltiy = Math.min(Math.max(prob, 0), 1);
    }

    predict() {
        //Using the probability number that's 0 to 1, predict if something will happen using the percent chance
        return Math.random() < this.probabiltiy; 
    }
}

function probability(percentChance) {
    return new Probability(percentChance);
}

window.probability = probability;

function random(n, n2) {
    if (n2) {
        return Math.floor(Math.random() * (n2 - n) + n);
    } else {
        return Math.floor(Math.random() * n);
    }
}

function randomf(n, n2) {
    if (n2) {
        return Math.random() * (n2 - n) + n;
    } else {
        return Math.random() * n;
    }
}

window.random = random;
window.randomf = randomf;

export default probability;

export { probability, random }