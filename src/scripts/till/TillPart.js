import React from "react";

class TillAppearance {
    static Type = {
        INPUT: 0,
        BLOCK: 1,
        RUN_BLOCK: 2,
    }
    constructor(background="white", textColor="black", type=TillAppearance.Type.BLOCK) {
        this.background = background;
        this.textColor = textColor;
        this.type = type;
    }
}

class TillParts {
    constructor(tillAppearnce = new TillAppearance(), name="", till="") {
        this.tillAppearnce = tillAppearnce;
    }
    draw(ctx, x, y) {
        ctx.fillStyle = this.tillAppearnce.background;
        ctx.fillRect(x, y, 100, 100);
    }
}

export default TillParts;

export {TillAppearance, TillParts};