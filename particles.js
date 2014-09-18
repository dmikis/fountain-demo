define(function () {

    var N = 1024;
    var NNN = 3 * N;

    var G = 9.8e-6; // m / ms^2

    var positions = new Float32Array(NNN);
    var startVelocities = new Float32Array(NNN);
    var startTimes = new Float32Array(N);

    var groundLevel = -10;

    for (var offset = 0; offset < NNN; offset += 3) {
        startVelocities[offset]     = 2e-3 * (Math.random() - 0.5);
        startVelocities[offset + 1] = 5e-3 + Math.random() * 5e-3;
        startVelocities[offset + 2] = 2e-3 * (Math.random() - 0.5);
    }

    for (var i = 0; i < N; ++i) {
        startTimes[i] = i / N * 1.5e3;
    }

    var ctx = document.querySelector('canvas').getContext('2d');
    ctx.canvas.width = 640;
    ctx.canvas.height = 480;

    return {

        update: function (time) {
            for (
                var i = 0, offset = 0;
                i < N;
                ++i, offset += 3
            ) {
                var dt = (time - startTimes[i]);
                dt = dt > 0 ? dt : 0;
                positions[offset]     = dt * startVelocities[offset]
                positions[offset + 1] = dt * startVelocities[offset + 1] - G * dt * dt;
                positions[offset + 2] = dt * startVelocities[offset + 2];

                if (positions[offset + 1] <= groundLevel) {
                    positions[offset] = 0;
                    positions[offset + 1] = 0;
                    positions[offset + 2] = 0;

                    startVelocities[offset]     = 2e-3 * (Math.random() - 0.5);
                    startVelocities[offset + 1] = 5e-3 + Math.random() * 5e-3 * Math.sin(time / 1000);
                    startVelocities[offset + 2] = 2e-3 * (Math.random() - 0.5);

                    startTimes[i] = time;
                }
            }
        },

        render: function () {
            ctx.clearRect(0, 0, 640, 480);

            ctx.fillStyle = 'rgba(255, 0, 0, 0.75)';

            for (var offset = 0; offset < NNN; offset += 3) {
                ctx.fillRect(
                    316 + 24 * positions[offset],
                    236 - 24 * positions[offset + 1],
                    8,
                    8
                );
            }
        }
    };
});
