#ifndef KDTREENODE_H
#define KDTREENODE_H

#define DIM 3

struct Vertex{
	double coord[DIM];
	Vertex() {}
	Vertex(const Vertex& vertex) {
		for (int i = 0; i < DIM; i++) {
			coord[i] = vertex.coord[i];
		}
	}
};

class KDTreeNode
{
private:
	int dim; 
	Vertex vertex;
public:
	KDTreeNode *left, *right, *parent;

	KDTreeNode() :left(0), right(0), parent(0), dim(0){}

	KDTreeNode(KDTreeNode *left, KDTreeNode *right, KDTreeNode *parent, int dim, const Vertex& vertex):
		left(left), right(right), parent(parent), dim(dim), vertex(vertex) {}

	KDTreeNode(const KDTreeNode &rhs);
	KDTreeNode& operator = (const KDTreeNode &rhs);

	Vertex& getVertex(){
		return vertex;
	}

	int& getDim()
	{
		return dim;
	}

	void create(KDTreeNode *left, KDTreeNode *right, KDTreeNode *parent, int dim, Vertex vertix);
};

double DistanceNode(const Vertex &a, const Vertex &b);

#endif
