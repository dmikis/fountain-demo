define(function () {

    var N = 1 << 10;
    var NNN = 3 * N;

    var G = 9.8e-6; // m / ms^2

    var positions = new Float32Array(NNN);
    var startPositions = new Float32Array(NNN);
    var startVelocities = new Float32Array(NNN);
    var startTimes = new Float32Array(N);

    var groundLevel = 0;

    for (var offset = 0; offset < NNN; offset += 3) {
        startVelocities[offset]     = 3e-3 * (Math.random() - 0.5);
        startVelocities[offset + 1] = 15e-3 + Math.random() * 15e-3;
        startVelocities[offset + 2] = 0 //3e-3 * (Math.random() - 0.5);
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
                positions[offset]     = startPositions[offset]     + dt * startVelocities[offset]
                positions[offset + 1] = startPositions[offset + 1] + dt * startVelocities[offset + 1] - G * dt * dt / 2;
                positions[offset + 2] = startPositions[offset + 2] + dt * startVelocities[offset + 2];

                if (positions[offset + 1] < groundLevel) {
                    startPositions[offset] = positions[offset];
                    startPositions[offset + 2] = positions[offset + 2];

                    positions[offset + 1] = startPositions[offset + 1] = groundLevel;
                    //positions[offset + 2] = 0;

                    //startVelocities[offset]     = 3e-3 * (Math.random() - 0.5);
                    //startVelocities[offset + 1] = 30e-3 * (1 + 0.4 * (Math.random() - 0.5)) * Math.max(0, Math.sin(time / 1000));
                    //startVelocities[offset + 2] = 3e-3 * (Math.random() - 0.5);

                    startVelocities[offset + 1] = 0.4 * -(startVelocities[offset + 1] - G * dt);

                    console.assert(startVelocities[offset + 1] > 0);

                    startTimes[i] = time;
                }
            }
        },

        render: function () {
            ctx.clearRect(0, 0, 640, 480);

            for (var offset = 0; offset < NNN; offset += 3) {
                var size = 40 / (5 + 0.5 * positions[offset + 2]);
                var r = 255 * (positions[offset + 1] / 20) | 0;
                ctx.fillStyle = 'rgba(' + r + ', 0, 0, 0.2)';
                ctx.fillRect(
                    320 - size / 2 + 12 * positions[offset],
                    440 - size / 2 - 12 * positions[offset + 1],
                    size,
                    size
                );
            }
        }
    };
});
