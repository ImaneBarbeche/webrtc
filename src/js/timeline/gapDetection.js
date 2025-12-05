




export function detectGaps(episodes) {
    const storedGaps = [];
    // const gap = {
    //     start: d,
    //     end: f,
    //     duration:
    // };
    episodes.sort((a, b) => a - b);

    if (episodes.start > nextEpisode.end) {
        return storedGaps.push(episodes);
    } else {
        console.log("tout va bien!")
    }
    return storedGaps;
}


// gap object {
// start: ....,
// end: ...,
// duration:....,
// color:...,
// }