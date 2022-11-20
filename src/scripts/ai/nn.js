import React from "react";
import Canvas from "../canvas/Canvas";
import "./nn.css"

function Activation() {
    return {
        sigmoid: {
            f(x) {
                return 1 / (1 + Math.exp(-x));
            },
            df(x) {
                const fx = this.f(x);
                return fx * (1 - fx);
            }
        },
        relu: {
            f(x) {
                return Math.max(0, x);
            },
            df(x) {
                return x > 0 ? 1 : 0;
            }
        },
    };
}

class NeuralNetwork {
    constructor(n_of_input_nodes=1, hidden_nodes=[1], output_nodes=1, learning_rate=0.1, activation=Activation().sigmoid) {
        this.input_nodes = n_of_input_nodes;
        this.hidden_layers = hidden_nodes.length;
        this.hidden_nodes = hidden_nodes;
        this.output_nodes = output_nodes;
        this.learning_rate = learning_rate;

        this.activation = activation;
        
        //Weights is (layer, to, from)
        this.weights = [];
        //Biases is (layer, neuron)
        this.biases = [];
        
        //The list of previous cost values. Used for plotting the graph. Might be a lot of memory usage tho.
        this.prevCosts = [];

        this.init();
    }
    randomized() {
        return Math.random() * 10 - 5;
    }
    init() {
        const neuronsPerLayer = this.getListOfNeuronsPerLayer();

        //Fill out the (layer) part of the weights and biases
        this.weights = new Array(this.hidden_layers + 1).fill(null);
        this.biases = new Array(this.hidden_layers + 1).fill(null);

        for (let i = 0; i < this.hidden_layers + 1; i++) {
            //Fill out the (to, from) part of the weights
            this.weights[i] = new Array(neuronsPerLayer[i + 1]).fill(
                []
            ).map(() => new Array(neuronsPerLayer[i]).fill(0).map(() => this.randomized()));
            
            //Fill out the (neuron) part of the biases
            this.biases[i] = new Array(neuronsPerLayer[i + 1]).fill(0).map(() => this.randomized());
        }
    }
    getListOfNeuronsPerLayer() {
        let list = new Array(this.hidden_layers + 2).fill(0);

        list[0] = this.input_nodes;
        list[list.length - 1] = this.output_nodes;

        for (let i = 0; i < this.hidden_layers; i++) {
            list[i + 1] = this.hidden_nodes[i];
        }

        return list;
    }
    feedforward(inputs, onlyPrediction=true) {
        const neuronsPerLayer = this.getListOfNeuronsPerLayer();

        let storedActivations = new Array(this.hidden_layers + 2).fill(null);

        storedActivations[0] = inputs;

        for (let i = 1; i < storedActivations.length; i++) {
            storedActivations[i] = new Array(neuronsPerLayer[i]).fill(0);
        }

        let previousLayer = [...inputs];
        for (let L = 1; L < this.hidden_layers + 2; L++) {
            let activationValuesForLayer = new Array(neuronsPerLayer[L]).fill(0);

            for (let neuron = 0; neuron < neuronsPerLayer[L]; neuron++) {
                let activationForNeuron = 0;
                for (let previousNeuron = 0; previousNeuron < neuronsPerLayer[L - 1]; previousNeuron++) {
                    activationForNeuron += previousLayer[previousNeuron] * this.weights[L - 1][neuron][previousNeuron];
                }
                
                let activation = activationForNeuron + this.biases[L - 1][neuron];
                if (!onlyPrediction) {
                    storedActivations[L][neuron] = activation;
                }

                activationValuesForLayer[neuron] = this.activation.f(activation);
            }

            previousLayer = [...activationValuesForLayer];
        }
        
        return onlyPrediction ? previousLayer : storedActivations;
    }
    cost(outputs, targets) {
        let total = 0;
        for (let i = 0; i < outputs.length; i++) {
            total += Math.pow(outputs[i] - targets[i], 2);
        }
        return total / outputs.length;
    }
    totalCost(inputs, targets) {
        let total = 0;
        for (let i = 0; i < inputs.length; i++) {
            const output = this.feedforward(inputs[i]);
            total += this.cost(output, targets[i]);
        }
        return total / inputs.length;
    }
    costDer(output, target) {
        return output - target;
    }
    costDers(inputs, targets) {
        let outputs = this.feedforward(inputs);

        let total = 0;
        for (let i = 0; i < outputs; i++) {
            total += this.costDer(outputs[i], targets[i]);
        }
        return total;
    }
    backpropagate(inputs=[], targets=[]) {
        if (inputs.length != this.input_nodes) throw new Error("Inputs must be of length " + this.input_nodes);
        if (targets.length != this.output_nodes) throw new Error("Targets must be of length " + this.output_nodes);

        const neuronsPerLayer = this.getListOfNeuronsPerLayer();

        let z = this.feedforward(inputs, false);

        let costDerivative = this.costDers(inputs, targets);
        
        //The first layer of the errorGradient will not be used. Just for a bit of easier thinking.
        let errorGradient = new Array(neuronsPerLayer.length).fill(null).map(
            (_, i) => new Array(neuronsPerLayer[i]).fill(0)
        );

        let weightGradient = new Array(neuronsPerLayer.length - 1).fill(null).map(
            (_, i) => {
                return new Array(neuronsPerLayer[i + 1]).fill(null).map(
                    (_, j) => new Array(neuronsPerLayer[i]).fill(0)
                );
            }
        );

        for (let l = neuronsPerLayer.length - 1; l >= 1; l--) {
            for (let j = 0; j < neuronsPerLayer[l]; j++) {
                let derOfActivation = 0;

                if (l == neuronsPerLayer.length - 1) {
                    derOfActivation = costDerivative;
                } else {
                    for (let i = 0; i < neuronsPerLayer[l + 1]; i++) {
                        derOfActivation += this.weights[l][i][j] * errorGradient[l + 1][i];
                    }
                }

                let error = this.activation.df(z[l][j]) * derOfActivation;
                errorGradient[l][j] = error;

                for (let k = 0; k < neuronsPerLayer[l - 1]; k++) {
                    let derWeight = this.activation.f(z[l - 1][k]) * error;
                    weightGradient[l - 1][j][k] = derWeight;
                }
            }
        }

        for (let l = 1; l < neuronsPerLayer.length; l++) {
            for (let j = 0; j < neuronsPerLayer[l]; j++) {
                for (let k = 0; k < neuronsPerLayer[l - 1]; k++) {
                    this.weights[l - 1][j][k] -= this.learning_rate * weightGradient[l - 1][j][k];
                }
                this.biases[l - 1][j] -= this.learning_rate * errorGradient[l][j];
            }
        }
    }
    printResults(inputs, targets) {
        for (let input of inputs) {
            const target = targets[inputs.indexOf(input)]
            const output = this.feedforward(input)
            const roundedOutput = output.map(x => Math.round(x))

            console.log("Testing with input: ", input, "Output: ", output, "\nExpected output: ", target, " (Rounded current output: ", roundedOutput, ")\nError: ", this.cost(output, target));
        }
    }
    train(inputs, targets, epochs, batchSize=1) {
        //console.log("Starting training...");
        const generateRandomOrder = (size) => {
            let order = new Array(size).fill(0).map((_, i) => i);
            for (let i = 0; i < size; i++) {
                let randomIndex = Math.floor(Math.random() * size);
                let temp = order[i];
                order[i] = order[randomIndex];
                order[randomIndex] = temp;
            }
            return order;
        }

        console.log("Before training:")
        this.printResults(inputs, targets);

        return new Promise((res) => {
            for (let epoch = 0; epoch < epochs; epoch++) {
                for (let batch = 0; batch < batchSize; batch++) {
                    const order = generateRandomOrder(inputs.length);
                    for (let i = 0; i < order.length; i++) {
                        this.backpropagate(inputs[order[i]], targets[order[i]]);
                    }
                    this.prevCosts.push(this.totalCost(inputs, targets));
                }
            }
            res();
        })
        console.log("Finished.")

        console.log("After training:")
        this.printResults(inputs, targets);
    }
}

class ReactNN extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nn: new NeuralNetwork(
                props.input_nodes || 1, 
                props.hidden_nodes || [1], 
                props.output_nodes || 1, 
                props.learning_rate || 0.01, 
                props.activation || Activation().sigmoid,
            ),
            training_data: props.training_data || {
                inputs: [],
                targets: [],
                epochs: 1,
                batchSize: 1,
            },
            active_menu: "Network",
            prev: "Network"
        }
    }
    render() {
        if (!window.NeuralNetwork) {
            window.NeuralNetwork = NeuralNetwork;
            window.activation = Activation();

            window.pause = true;
        }

        const network = this.state.nn;

        const drawNetworkLayout = ((ctx, frameCount, rel) => {
            ctx.fillStyle = "rgb(210, 210, 210)";
            ctx.fillRect(0, 0, 500 * rel.w, 500 * rel.h);
            
            const neuronsPerLayer = network.getListOfNeuronsPerLayer();

            ctx.fillStyle = "gray";
            ctx.lineWidth = 5 * rel.w;
            ctx.strokeStyle = "gray";

            const calcColorAndWidth = (val) => {
                const f = (x) => {
                    //this graph just looked like it should work.
                    return 6 * (-Math.pow(1.2, -x + 7.4) + 5 + (0.05 * x));
                }

                let color;
                if (val < 0) {
                    color = `rgb(${Math.min(200 + (Math.abs(val) / 3 * 50), 255)}, 0, 0)`
                } else {
                    color = `rgb(0, ${Math.min(200 + (Math.abs(val) / 3 * 50), 255)}, 0)`
                }
                return {
                    color,
                    width: f(Math.abs(val))
                }
            }

            //it took waaaay too long to figure this out ;-;
            const figureOutSpacing = (x) => {
                return 0.5 * x - 0.5
            }

            const calcX = (l) => {
                return 50 + (400 / (neuronsPerLayer.length)) * l;
            }

            for (let l = 0; l < neuronsPerLayer.length; l++) {
                const ySpace = (neuronsPerLayer[l] > 1 ? 300 / neuronsPerLayer[l] : 0);
                let x = calcX(l)

                for (let j = 0; j < neuronsPerLayer[l]; j++) {
                    if (l < neuronsPerLayer.length - 1) {
                        let y = 250 - ySpace * j + (ySpace * figureOutSpacing(neuronsPerLayer[l]));

                        const nextYSpace = (neuronsPerLayer[l + 1] > 1 ? 300 / neuronsPerLayer[l + 1] : 0);
                        for (let k = 0; k < neuronsPerLayer[l + 1]; k++) {
                            const styleData = calcColorAndWidth(network.weights[l][k][j]);
                            ctx.lineWidth = Math.ceil(styleData.width) * rel.w / 4;
                            ctx.strokeStyle = styleData.color;

                            let nextX = calcX(l + 1);
                            let nextY = 250 - nextYSpace * k + (nextYSpace * figureOutSpacing(neuronsPerLayer[l + 1]));
                            ctx.beginPath();
                            ctx.moveTo(x * rel.w, y * rel.h);
                            ctx.lineTo(nextX * rel.w, nextY * rel.h);
                            ctx.stroke();
                        }
                    }
                }
            }

            for (let l = 0; l < neuronsPerLayer.length; l++) {
                const ySpace = (neuronsPerLayer[l] > 1 ? 300 / neuronsPerLayer[l] : 0);
                let x = calcX(l)
                for (let j = 0; j < neuronsPerLayer[l]; j++) {
                    //Space it around y = 250
                    let y = 250 - ySpace * j + (ySpace * figureOutSpacing(neuronsPerLayer[l]));

                    const styleData = l > 0 ? calcColorAndWidth(network.biases[l - 1][j]) : {
                        color: "gray",
                        width: 10
                    };

                    ctx.fillStyle = styleData.color;
                    ctx.fillRect((x - (Math.ceil(styleData.width) / 2)) * rel.w, (y - (Math.ceil(styleData.width) / 2)) * rel.h, Math.ceil(styleData.width) * rel.w, Math.ceil(styleData.width) * rel.h);
                }
            }
        }).bind(this);

        const drawCostGraph = ((ctx, frameCount, rel) => {
            ctx.fillStyle = "rgb(210, 210, 210)";
            ctx.fillRect(0, 0, 500 * rel.w, 500 * rel.h);

            const history = this.state.nn.prevCosts;
            const xPadding = 10;
            const hisIndexAdd = Math.floor(history.length / (500 - (2 * xPadding)));

            const milestones = new Array(4).fill(false);

            for (let i = 0; i < history.length; i += hisIndexAdd) {
                ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
                ctx.fillRect((i / hisIndexAdd + xPadding) * rel.w, (459 - (459 * history[i])) * rel.w, rel.w, history[i] * 459 * rel.h);
                ctx.fillStyle = "rgb(0, 255, 0)";
                ctx.fillRect((i / hisIndexAdd + xPadding) * rel.w, (459 - (459 * history[i])) * rel.w, rel.w, 3);
            }
            
            for (let i = 0; i < history.length; i+=hisIndexAdd) {
                const milestone = Math.floor(i / history.length * 4);
                if (milestone > -1) {
                    if (!milestones[milestone]) {
                        ctx.font = "10px Arial";
                        ctx.fillStyle = "black";
                        ctx.fillText(`${Math.floor(i)}`, (i / history.length * 500) * rel.w - 5, 450 * rel.h);
                        milestones[milestone] = true;
                    }
                }
            }

            for (let y = 0; y < 4; y++) {
                ctx.font = "10px Arial";
                ctx.fillStyle = "black";
                const disp = (0.25 * (4 - (y)))
                ctx.fillText(`${disp == 1 ? "1.0" : disp}`, 10 * rel.w, (20 + (450 / 4) * y) * rel.h);
            }

            ctx.fillText(`Current Cost: ${history[history.length - 1] || 1}`, 60 * rel.w, 20 * rel.h);
        }).bind(this);

        const menu = ((ctx, frameCount, rel, canvas, mouse) => {
            ctx.fillStyle = "rgb(235, 235, 235)";
            ctx.fillRect(0, 460 * rel.h, 500 * rel.w, 500 * rel.h);

            ctx.fillStyle = "rgb(100, 100, 100)";
            ctx.fillRect(0, 460 * rel.h, 500 * rel.w, 2 * rel.h);

            const slowTrain = false;

            let menuItems = [
                {
                    name: "Network",
                },
                {
                    name: "Cost",
                },
                {
                    name: "Train",
                    action: () => {
                        this.setState({active_menu: "Cost"});

                        if (!slowTrain) {
                            network.train(this.state.training_data.inputs, this.state.training_data.targets, this.state.training_data.epochs, this.state.training_data.batchSize);
                        } else {
                            const updateAndSetTimeout = async () => {
                                const cost = network.totalCost(this.state.training_data.inputs, this.state.training_data.targets);
                                if (cost > 0.01) {
                                    await network.train(this.state.training_data.inputs, this.state.training_data.targets, 100, 1);
                                    setTimeout(() => {
                                        updateAndSetTimeout();
                                    }, 2000);
                                } else {
                                    alert('done maybe idk')
                                }
                            }
                            updateAndSetTimeout();

                        }
                    }
                }
            ]

            const menuItemWidth = 500 / menuItems.length;

            for (let i = 0; i < menuItems.length; i++) {

                // console.log(mouse.x > (menuItemWidth * i * rel.w),
                //     mouse.x < (menuItemWidth * (i + 1) * rel.w),
                //     mouse.y > (460 * rel.h),
                //     mouse.y < (500 * rel.h))
                if (
                    mouse.x > (menuItemWidth * i * rel.w) &&
                    mouse.x < (menuItemWidth * (i + 1) * rel.w) &&
                    mouse.y > (460 * rel.h) &&
                    mouse.y < (500 * rel.h) && mouse.inCanvas && this.state.active_menu !== menuItems[i].name
                ) {
                    ctx.fillStyle = "rgb(235, 235, 235)";

                    if (mouse.down) {
                        this.setState({
                            active_menu: menuItems[i].name,
                        })

                        if (menuItems[i]["action"]) {
                            menuItems[i]["action"]();
                        }
                    }
                } else if (this.state.active_menu == menuItems[i].name) {
                    ctx.fillStyle = "rgb(240, 240, 240)";
                } else {
                    ctx.fillStyle = "rgb(200, 200, 200)";
                }

                ctx.fillRect(menuItemWidth * i * rel.w, 461 * rel.h, menuItemWidth * rel.w, 40 * rel.h);

                
                ctx.fillStyle = "rgb(100, 100, 100)";
                if (i > 0) ctx.fillRect(menuItemWidth * i * rel.w, 461 * rel.h, 2 * rel.w, 40 * rel.h);

                //Text
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.font = `${20 * rel.w}px Arial`;
                ctx.fillText(menuItems[i].name, menuItemWidth * i * rel.w + 5, 490 * rel.h);
            }

            ctx.fillStyle = "rgb(100, 100, 100)";
            ctx.fillRect(menuItemWidth * menuItems.length * rel.w, 461 * rel.h, 2 * rel.w, 40 * rel.h);
        }).bind(this);

        const button = (<button onClick={() => {
            network.train(this.state.training_data.inputs, this.state.training_data.targets, this.state.training_data.epochs, this.state.training_data.batchSize);
        }}>Train</button>);
        
        return (
            <div className="nn">
                <Canvas width={this.props.size || "350px"} height={this.props.size || "350px"} draw={(...params) => {
                    if (this.state.active_menu == "Network") {
                        drawNetworkLayout(...params);
                    } else {
                        drawCostGraph(...params);
                    }

                    menu(...params);
                }}></Canvas><br/>
            </div>
        );
    }
}

export default { NeuralNetwork, Activation, ReactNN };