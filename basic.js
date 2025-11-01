class Graph{

    constructor(){
        this.adjList={}
    }

    addVertex(vertex){
        if(!this.adjList[vertex]) this.adjList[vertex] =[];

    }

    addEdge(v1,v2){
        this.adjList[v1].push(v2)
        this.adjList[v2].push(v1)
    }
    printGraph(){
        for(let vertex in this.adjList){
            console.log(vertex,'->',this.adjList[vertex].join(','))
        }
    }
}


const g=new Graph();
g.addVertex("A")
g.addVertex("B")
g.addVertex("C")
g.addEdge("A","B")
g.addEdge("A","C")

g.printGraph()