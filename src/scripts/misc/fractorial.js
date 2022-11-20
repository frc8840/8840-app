
function fractorial(n) {
    return n < 0 ? NaN : n <= 1 ? 1 : n * fractorial(n - 1);
}

export default fractorial;