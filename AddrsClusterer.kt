package com.zduniak.addrsclusterer

import com.beust.klaxon.*
import java.io.StringReader
import java.net.URL
import kotlin.math.max
import kotlin.math.min


fun main(args : Array<String>) {

    var clusters: MutableList<MutableList<String>> = mutableListOf()

    fun mergeClusters(clusterIdx1 : Int, clusterIdx2 : Int) {
        require(clusterIdx1 >= 0 && clusterIdx2 >= 0)
        require(clusterIdx1 < clusters.size && clusterIdx2 < clusters.size)
        require(clusterIdx1 != clusterIdx2)
        val idx1 = min(clusterIdx1, clusterIdx2)
        val idx2 = max(clusterIdx1, clusterIdx2)
        println("Merging cluster " + idx2 + " into " + idx1)
        // 1. add elements from listIdx2 to listIdx1
        for (a in clusters[idx2]) {
            clusters[idx1].add(a)
        }
        // 2. copy whole last element from the cluster and put it on the position idx2
        clusters[idx2] = clusters.last()

        // 3. remove last element from the cluster
        clusters.removeAt(clusters.lastIndex)

    }

    fun whichCluster(addr : String) : Int {
        for (i in 0..clusters.size-1) {
            if (clusters[i].contains(addr)) {
                return i;
            }
        }
        return -1;
    }

    fun findExistingCluster(inputs: JsonArray<JsonObject>) : Int {
        for (i in inputs) {
            val addr = i.obj("prev_out")?.string("addr")
            if (null != addr) {
                val clusterIndex = whichCluster(addr)
                if (clusterIndex >= 0) {
                    return clusterIndex;
                }
            }

        }
        return -1;
    }

    val result = URL("https://blockchain.info/rawblock/0000000000000359be6774f86dec526367120cbfc7dadf6392b6ddbda2af3a3e").readText()

    val parser = Parser()
    val json: JsonObject = parser.parse(StringReader(result)) as JsonObject
    val txs : JsonArray<JsonObject> = json.array("tx")!!
    for (tx in txs) {
        val inputs : JsonArray<JsonObject> = tx.array("inputs")!!

        // Check if any input from this tx is in any cluster already
        var clusterIdxIn = findExistingCluster(inputs)

        // check if there are any input other then coinbase:
        if (null != inputs[0].obj("prev_out")) {

            if (clusterIdxIn == -1) {
                // create new cluster:
                clusterIdxIn = clusters.size
                clusters.add(mutableListOf());
            }
            // add addresses to the cluster:
            for (i in inputs) {
                val addr = i.obj("prev_out")?.string("addr")
                if (null != addr) {
                    clusters[clusterIdxIn].add(addr);
                    println("Adding " + addr + " to cluster (IN) " + clusterIdxIn)
                }
            }
        }



        // new let's cluster the outputs:
        val outputs : JsonArray<JsonObject> = tx.array("out")!!
        for (i in 0..outputs.size-1) {
            val out = outputs[i]
            val addr = out.string("addr")!!;
            // if there is only 1 input in this tx and only 2 outputs:
            var clusterIdxOut = whichCluster(addr);
            // create new cluster only if this address was not stored in any cluster previously:
            if (-1 == clusterIdxOut) {
                clusterIdxOut = clusters.size
                clusters.add(mutableListOf(addr));
                println("Adding " + addr + " to cluster (OUT) " + clusterIdxOut)
            }

            // if there is only one input:
            if (inputs.size == 1 && outputs.size == 2) {
                // then output bigger in value belongs to different person then the smaller (change) output.
                // Change belongs to the same cluster as the inputs of this transaction.
                // Check if this is the smaller output, so we can merge:
                val out0 = outputs[0];
                val out1 = outputs[1];
                if ((i == 0 && out0.int("value")!! < out1.int("value")!!)
                    || (i == 1 && out1.int("value")!! < out0.int("value")!!)) {
                    // Merge this output with the input cluster
                    mergeClusters(clusterIdxIn, clusterIdxOut)
                }
            }
        }

        // If there is more then 1 inputs: The change value is smaller than any of the spent outputs.
        // So when we identify which output is a change we merge it with all the inputs in one cluster
        if (inputs.size > 1 && outputs.size > 1) {
            // let's find the min output:
            var minVal = Integer.MAX_VALUE
            var minOutAddr : String? = null;
            for (i in 0..outputs.size-1) {
                val out = outputs[i]
                val value = out.int("value")!!;
                if (value < minVal) {
                    minVal = value;
                    minOutAddr = out.string("addr");
                }
            }
            // now we have min output, so let's see if it is smaller then all of the inputs:
            var smallerThenAllInputs = true;
            for (i in inputs) {
                val value = i.obj("prev_out")?.int("value")!!
                if (minVal >= value) {
                    smallerThenAllInputs = false
                    break
                }
            }
            if (smallerThenAllInputs) {
                // TODO: tutaj jest cos zle, minOutIndex to nie jest przeciez cluster index !!!!!
                // Merge change output with the input cluster
                val clusterIndexOut = whichCluster(minOutAddr!!)
                mergeClusters(clusterIdxIn, clusterIndexOut)
            }
        }
    }

    StartOver@
    // check if any cluster overlaps with any other, if they do merge them:
    for (i1 in 0..clusters.size-1) { // iterate over all clusters
        for (i2 in 0..clusters.size-1) { // iterate over all clusters again
            if (i1 == i2) continue
            for (a in clusters[i2]) { // iterate over all addresses in chosen cluster
                if (clusters[i1].contains(a)) { // if clusters overlaps:
                    mergeClusters(i1, i2)
                    continue@StartOver
                }
            }
        }
    }

    // Remove duplicated addresses:
    for (i in 0..clusters.size-1) {
        clusters[i] = clusters[i].distinct().toMutableList()
    }

    println(clusters.size)
    clusters.forEach {
        println("Cluster: " + it)
    }

}



