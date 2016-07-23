package tree

import (
	"bytes"
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
)

type PNode struct {
	Parent  Node
	Length  int
	Address int
}

func (p *PNode) AddRune(r rune, position int) {
	up := &Branch{Parent: p.Parent, Length: p.Length + 1}
	if position > p.Length/2 {
		up.Left = &PNode{up, position, p.Address}
		up.LengthLeft = position
		if position < p.Length {
			down := &Branch{Parent: up, Length: p.Length + 1 - position, LengthLeft: 1}
			up.Right = down
			down.Left = &TNode{down, 1, []rune{r}}
			down.Right = &PNode{down, p.Length - position, p.Address + position}
		} else {
			up.Right = &TNode{up, 1, []rune{r}}
		}
	} else {
		up.Right = &PNode{up, p.Length - position, p.Address + position}
		up.LengthLeft = position + 1
		if position > 0 {
			down := &Branch{Parent: up, Length: position + 1, LengthLeft: position}
			up.Left = down
			down.Right = &TNode{down, 1, []rune{r}}
			down.Left = &PNode{down, position, p.Address}
		} else {
			up.Left = &TNode{up, 1, []rune{r}}
		}
	}
	switch parent := p.Parent.(type) {
	case *Branch:
		fmt.Println("branch parent")
		if parent.Left == p {
			parent.Left = up
		} else {
			parent.Right = up
		}
	case *Root:
		fmt.Println("root parent")
		parent.Down = up
	}
}

func (p *PNode) SetParent(parent Node) {
	p.Parent = parent
}

func (p *PNode) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	fmt.Println("going to PNode")
	return ilex.ReadBlockFromPermascrollToBuffer(p.Length, p.Address, buffer, slices)
}

func (p *PNode) Print(indentation int) {
	indent(indentation)
	fmt.Println("PNode:", p.Length, "at address", p.Address)
}

func (p *PNode) GetLength() int {
	return p.Length
}

func (p *PNode) Persist(addresses ilex.AddressTable, slices *mgo.Collection) (ilex.AddressTable, error) {
	last := addresses[len(addresses)-1]
	addresses[len(addresses)-1] = ilex.Address{last[0], p.Address}
	addresses = append(addresses, ilex.Address{last[0] + p.Length, 0})
	return addresses, nil
}
