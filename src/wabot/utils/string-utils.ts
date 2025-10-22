declare global{
    interface String {
        equals(other: string): boolean;
    }
}

String.prototype.equals = function (other: string): boolean {
    return this.indexOf(other) > -1;
}

export {};