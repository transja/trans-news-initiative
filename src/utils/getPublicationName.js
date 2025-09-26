import leanData from "../data/lean.csv";

export const getPublicationName = (publication) => {
    const label = leanData.find((d) => d.domain === publication)?.label
    if (!label) return publication
    return label;
};