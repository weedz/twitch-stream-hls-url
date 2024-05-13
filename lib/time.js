/**
 * Calculates the number of hours, minutes and seconds between `epochB` and `epochA`
 * @param {number} epochA
 * @param {number} epochB
 */
export function calculateTimeDifference(epochA, epochB) {
    let epochDifference = Math.floor((epochB - epochA) / 1000);
    const hours = Math.floor(epochDifference / 3600);
    epochDifference = epochDifference % 3600;

    const minutes = Math.floor(epochDifference / 60);

    const seconds = Math.floor(epochDifference % 60);

    return { hours, minutes, seconds };
}
